from django.conf import settings
from django.shortcuts import redirect, render
from django.views import View
from django.http import FileResponse, HttpResponse, HttpResponseRedirect, JsonResponse, Http404
from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse
from django.contrib.auth import login, logout
from .models import Usuario, Conversa, Mensagem, Documento
from .rag import consultar_rag, carregar_documentos_no_retriever
from .run_tests import obtem_contexto, chama_sabia3
from django.contrib.auth.hashers import check_password
from django.contrib import messages
from django.core.exceptions import ValidationError, PermissionDenied
from django.core import serializers
from django.views.decorators.csrf import ensure_csrf_cookie
from decouple import config
from django.core.files.storage.base import Storage
from django.views.decorators.clickjacking import xframe_options_exempt
from PyPDF2 import PdfReader, PdfWriter
from io import BytesIO
import pandas as pd
import pdfplumber
import json
import openai
import os
import csv



@ensure_csrf_cookie
def csrf_token_view(request): # Retorna CSRF_TOKEN para o front
    return JsonResponse({'detail': 'CSRF cookie set'})

########################## View da página de login ########################################
class LoginView(View):
    def get(self, request):
        if request.user.is_authenticated: # Se o usuário está logado, redireciona para página de nova conversa
            return HttpResponseRedirect(reverse('new_chat'))
        
        return render(request, 'login.html')

    def post(self, request):
        if request.user.is_authenticated:
            return HttpResponseRedirect(reverse('new_chat')) # Se o usuário está logado, redireciona para página de nova conversa

        try:
            email = request.POST.get("email") #Obtém email e senha digitados
            senha = request.POST.get("senha")
            usuario = Usuario.objects.get(email=email) # Tenta obter usuário a partir do email

            if usuario is None: # Se não achar nenhum usuário com o email informado, exibe erro
                messages.error(request, "Email não cadastrado ou incorreto")
                return render(request, "login.html")
            
            if not check_password(senha, usuario.password) and usuario.is_active: # Se o usuário existir mas a senha não estiver correta, exibe erro
                messages.error(request, "Senha incorreta")
                return render(request, "login.html")

            login(request, usuario) # Loga o usuário e redireciona para nova conversa
            return HttpResponseRedirect(reverse('new_chat'))
        
        except Exception as e: # Se obtém algum erro, exibe mensagem de erro
            messages.error(request, "Email não cadastrado ou incorreto")
        
        return render(request, "login.html")

########################## View de Logout ########################################
class LogoutView(LoginRequiredMixin, View):
    def get(self, request):
        if request.user.is_authenticated: # Se o usuário está logado, faz o logout
            logout(request)
        return HttpResponseRedirect(reverse("login"))

########################## View da página de Cadastro ########################################
class CadastroView(View):
    def get(self, request):
        return render(request, 'cadastro.html')
        
    def post(self, request):
        try: # Tenta obter nome do usuário, email e senha1 e senha2 (para confirmação)
            username = request.POST.get("nome").title() #obtém nome do usuário com letra maiúscula
            email = request.POST.get("email")
            senha1 = request.POST.get("senha1")
            senha2 = request.POST.get("senha2")

            ###TODO: Elaborar métodos de validação melhores nas views no front###
            if username != "" and email != "" and senha1 == senha2:  # Verifica os dados fornecidos
                novo_usuario = Usuario(username=username, email=email) # Cria novo usuário
                novo_usuario.set_password(senha1) # Define senha e salva
                novo_usuario.save()
                login(request, novo_usuario) # Faz login e redireciona para View de nova conversa
                return HttpResponseRedirect(reverse('new_chat'))
            
            else: # Se os dados não passarem na verificação, exibe mensagem de erro
                messages.error(request, "Não foi possível realizar o cadastro. Verifique os dados e tente novamente")
                return render(request, "cadastro.html")
            
        except: # Se não conseguir obter os dados, exibe mensagem de erro
            messages.error(request, "Não foi possível realizar o cadastro. Verifique os dados e tente novamente")
            return render(request, "cadastro.html")

########################## View da página de Conversa (Chat) ########################################
class ChatBotView(LoginRequiredMixin, View):
    def get(self, request, conversa_id=None):
        if not request.user.is_authenticated:
            raise PermissionDenied("Você não possui permissão para visualizar esta conversa. Faça login com sua conta e tente novamente")

        usuario = Usuario.objects.get(pk=request.user.pk) # Obtém usuário

        context = {
                "conversa_id": conversa_id,
                "prompt_instrucao": usuario.prompt_instrucao,
            }
        # Conversa já existente
        if conversa_id:
            try:    
                conversa_atual = Conversa.objects.get(pk=conversa_id) #Obtém conversa atual
                if conversa_atual.usuario != request.user: # Se a conversa não pertencer ao usuário, exibe página de erro 404
                    raise Http404("Conversa não encontrada")
            
            except Conversa.DoesNotExist: # Se a conversa não existir, exibe página de erro 404
                raise Http404("Conversa não encontrada")
            
            context["conversa_atual"] = conversa_atual

        # Nova Conversa
        else:
            context["nome_usuario"] = usuario.username.title()
            
        return render(request, 'chat.html', context)
    
    def post(self, request, conversa_id=None):
        conteudo_PDF = ""

        try:
            conteudo_mensagem_usuario = request.POST["message"] # obtém requisição AJAX do front com a pergunta do usuário
            usuario = Usuario.objects.get(pk=request.user.pk) # Obtém usuário

            # Conversa já existente
            if conversa_id:
                conversa_atual = Conversa.objects.get(pk=conversa_id) # Obtém conversa atual
                if conversa_atual.usuario != request.user: # Se a conversa atual não pertencer ao usuário, retorna Erro
                    return JsonResponse({"success": False, "error": "Conversa não encontrada"}, status=404)
                
            # Nova conversa
            else: # Cria um nome para a conversa a partir dos primeiros caracteres da mensagem
                if len(conteudo_mensagem_usuario) > 20:
                    nome_conversa = conteudo_mensagem_usuario[:20] + "..."
                
                elif len(conteudo_mensagem_usuario) <= 20 and len(conteudo_mensagem_usuario) >= 1:
                    nome_conversa = conteudo_mensagem_usuario
                else:
                    return JsonResponse({"success": False, "error": "Mensagem inválida"})
            
                conversa_atual = Conversa(usuario=usuario, nome=nome_conversa) #Cria nova conversa
                conversa_atual.save()

            nova_mensagem_usuario = Mensagem(conversa=conversa_atual, texto=conteudo_mensagem_usuario) #Cria nova mensagem
            nova_mensagem_usuario.save()

            arquivo = request.FILES.get("arquivo")
            if arquivo: # Anexa arquivo a mensagem, se houver
                nome_valido = Storage().get_valid_name(str(arquivo))
                documento = Documento.objects.create(titulo=nome_valido, arquivo=arquivo, mensagem=nova_mensagem_usuario, usuario=usuario) # Salva arquivo

                # ------------------------------------------------------
                # Usa biblioteca pdfplumber para obter string do PDF
                # ------------------------------------------------------
                file_path = os.path.join(settings.MEDIA_ROOT, "upload", documento.titulo)
                with pdfplumber.open(file_path) as pdf:
                    for pagina in pdf.pages:
                        conteudo_PDF += pagina.extract_text() + "\n"

                print(conteudo_PDF)
                conteudo_PDF = "Conteúdo do PDF anexado à mensagem: " + conteudo_PDF
                

            else:
                documento = None
            
            # ------------------------------------------
            # Realiza consulta com RAG aos arquivos JSON
            # ------------------------------------------
            carregar_documentos_no_retriever() # Carrega JSONs no retriever
            contexto = consultar_rag(conteudo_mensagem_usuario)
            print(contexto)

            # -----------------------------------
            # Faz uma requisição para a API da IA
            # -----------------------------------
            client = openai.OpenAI(
                api_key=config('LLM_API_KEY'),
                base_url="https://chat.maritaca.ai/api"
            )

            response = client.chat.completions.create( # Corpo da requisição
              model="sabia-3",
              messages=[
                {"role": "system", "content": usuario.prompt_instrucao},
                {"role": "user", "content": f"Contexto: {contexto} Pergunta do usuário: {conteudo_mensagem_usuario} Conteúdo do PDF: {conteudo_PDF}"},
              ],
              max_tokens=8000
            )
            mensagem_IA = response.choices[0].message.content # Extrai mensagem da IA

            nova_mensagem_IA = Mensagem(conversa=conversa_atual, texto=mensagem_IA, eh_do_usuario=False) #Salva resposta da IA
            nova_mensagem_IA.save()
            
            # Nova conversa
            if conversa_id:
                return JsonResponse({
                    "success": True, 
                    "message": mensagem_IA, 
                    "documento":{
                        "pk": documento.pk, 
                        "titulo": documento.titulo
                    } if documento else None
                }, status=200) # Envia mensagem da IA para o front

            else:
                redirect_url = reverse('chat', args=[conversa_atual.pk]) # Envia mensagem da IA para o front junto com o nome da nova conversa, ID e URL
                return JsonResponse({
                    'success': True, 
                    'message': mensagem_IA, 
                    'nome_da_nova_conversa': nome_conversa, 
                    'nova_conversa_id': conversa_atual.pk, 
                    'redirect': redirect_url,
                    'documento': {
                        'pk': documento.pk,
                        'titulo': documento.titulo,
                    } if documento else None
                }, status=200)
                
        except Conversa.DoesNotExist:
            return JsonResponse({"success": False, "error": "Conversa não encontrada"}, status=404)
        
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=500)
        
        except:
            return JsonResponse({"success": False, "error": "Método não permitido"}, status=405)

######################### View da API para obter a lista de conversas ########################################
class GetConversasView(LoginRequiredMixin, View):
    def get(self, request):
        try: # Envia para o front todas as conversas do usuário numa lista, começando pelas mais recentes, para compor a conversation sidebar no front
            usuario = Usuario.objects.get(pk=request.user.pk) 
            queryset_conversas = Conversa.objects.filter(usuario=usuario).order_by('-data')
            todas_as_conversas = serializers.serialize('json', queryset_conversas)
            return JsonResponse(todas_as_conversas, safe=False)
        
        except:
            return JsonResponse({"success": False, "error": 'Erro na obtenção das conversas'})
        
######################### View da API para obter a lista de mensagens de uma conversa ########################################
class GetMensagensView(LoginRequiredMixin, View):
    def get(self, request, conversa_id):
        try: # Envia para o front todas as mensagens de uma conversa especificada do usuário numa lista
            conversa_atual = Conversa.objects.get(pk=conversa_id)
            queryset_mensagens = conversa_atual.mensagens.all().order_by('data')
            
            mensagens = []
            for m in queryset_mensagens:
                mensagens.append({
                    'pk': m.pk,
                    'fields': {
                        'texto': m.texto,
                        'eh_do_usuario': m.eh_do_usuario,
                        'data': m.data,
                        'documento': {
                            'pk': m.documento.pk,
                            'titulo': m.documento.titulo,
                            'arquivo_url': f'/show-pdf/{m.documento.pk}'
                        } if hasattr(m, 'documento') and m.documento else None
                    } 
                })

            return JsonResponse(mensagens, safe=False)
        
        except:
            return JsonResponse({"success": False, "error": f'Erro na obtenção das mensagens da conversa de código: {conversa_id}'})
        
######################### View da API para obter a lista de arquivos PDFs de um usuário ########################################
class GetDocumentosView(LoginRequiredMixin, View):    
    def get(self, request):
        try: # Envia para o front todos os arquivos PDF do usuário numa lista, começando pelos mais recentes
            usuario = Usuario.objects.get(pk=request.user.pk) 
            queryset_documentos = Documento.objects.filter(usuario=usuario).order_by('-data')
            todos_os_documentos = serializers.serialize('json', queryset_documentos)
            return JsonResponse(todos_os_documentos, safe=False)
        
        except:
            return JsonResponse({"success": False, "error": 'Erro na obtenção das conversas'})

######################### View da API para renomear uma conversa ########################################            
class RenameView(LoginRequiredMixin, View):
    def post(self, request, conversa_id):
        try:
            data = json.loads(request.body) # Obtém do front a requisição com o novo nome
            conversa = Conversa.objects.get(pk=conversa_id)

            if conversa.usuario != request.user: # Se a conversa não pertence ao usuário logado, exibe erro 404
                raise JsonResponse({"success": False, "error": "Conversa não encontrada"}, status=404)

            conversa.nome = data.get("nome", conversa.nome) # Obtém novo nome da conversa e salva
            conversa.save()

            return JsonResponse({"success": True, f"message": f"Conversa renomeada com sucesso!"}, status=200)

        except Conversa.DoesNotExist:
            return JsonResponse({"success": False, "error": "Conversa não encontrada"}, status=404)
        
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=500)
        
        except:
            return JsonResponse({"success": False, "error": "Método não permitido"}, status=405)

######################### View da API para deletar uma conversa ########################################
class DeleteView(LoginRequiredMixin, View):
    def post(self, request, conversa_id):
        try:
            conversa_delete = Conversa.objects.get(pk=conversa_id) #Obtém conversa a ser deletada pelo ID

            if conversa_delete.usuario != request.user: # Se a conversa não pertence ao usuário logado, exibe erro 404
                raise JsonResponse({"success": False, "error": "Conversa não encontrada"}, status=404)

            conversa_delete_nome = conversa_delete.nome # Salva nome da conversa para exibir na resposta JSON
            conversa_delete.delete() # Deleta conversa
            
            return JsonResponse({"success": True, "message": f"Conversa '{conversa_delete_nome}' deletada com sucesso!"}, status=200)
        
        except Conversa.DoesNotExist:
            return JsonResponse({"success": False, "error": f"Conversa '{conversa_delete_nome}' não encontrada"}, status=404)
        
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=500)
        
        except:
            return JsonResponse({"success": False, "error": "Método não permitido"}, status=405)

######################### View da API para atualizar prompt ########################################
class ChangePromptView(LoginRequiredMixin, View):
    def post(self, request):
        try:
            usuario = Usuario.objects.get(pk=request.user.pk)
            data = json.loads(request.body)
            usuario.prompt_instrucao = data.get("message") #extrai conteúdo da mensagem
            usuario.save()

            return JsonResponse({'success': True, 'message': 'Alteração do prompt feita com sucesso!'})
        
        except:
            return JsonResponse({"success": False, "error": "Erro na alteração do prompt"}, status=500)

######################### View da Para Visualizar PDF ########################################
class ShowPDFView(LoginRequiredMixin, View):

    @xframe_options_exempt
    def get(self, request, file_id):
        if not request.user.is_authenticated:
            raise PermissionDenied("Você não possui permissão para visualizar este arquivo PDF. Faça login com sua conta e tente novamente")
        
        usuario_logado = Usuario.objects.get(pk=request.user.pk)
        try:
            documento = Documento.objects.get(pk=file_id)
            nome_arquivo = documento.titulo

            if usuario_logado != documento.usuario:
                raise PermissionDenied("Você não possui permissão para visualizar este arquivo PDF.")
            
        except PermissionDenied:
            raise PermissionDenied("Você não possui permissão para visualizar este arquivo PDF.")
        
        except Documento.DoesNotExist:
            raise Http404("Este documento não existe")
        
        except Exception as e:
            raise Http404("Este documento não existe")
        
        caminho = os.path.join(settings.MEDIA_ROOT, "upload", nome_arquivo)
        if os.path.exists(caminho):
            # Se o PDF está sendo exibido no Modal, carrega apenas a primeira página
            if "is_modal" in request.GET:
                is_modal_str = request.GET["is_modal"]
                is_modal = True if is_modal_str == "true" else False
            else:
                is_modal = False

            if is_modal:
                reader = PdfReader(caminho)
                writer = PdfWriter()
                writer.add_page(reader.pages[0])
                output = BytesIO()
                writer.write(output)
                output.seek(0)
                return FileResponse(output, content_type='application/pdf')
            
            # Se o PDF está sendo exibido
            else:
                return FileResponse(open(caminho, 'rb'), content_type='application/pdf')
                
        else:
            raise Http404("Arquivo não encontrado")
        
######################### View da Para Deletar PDF ########################################
class DeletePDFView(LoginRequiredMixin, View):
    def post(self, request, file_id):
        if not request.user.is_authenticated:
            raise PermissionDenied("Você não possui permissão para apagar este arquivo PDF. Faça login com sua conta e tente novamente")
        
        try:
            usuario = Usuario.objects.get(pk=request.user.pk)
            documento = Documento.objects.get(pk=file_id)

            if documento.usuario != usuario:
                raise PermissionDenied("Você não possui permissão para apagar este arquivo PDF.")
            
            nome_documento = documento.titulo
            documento.delete()
            return JsonResponse({"success": True, "message": f"Documento '{nome_documento}' deletado com sucesso!"}, status=200)
        
        except PermissionDenied:
            raise PermissionDenied("Você não possui permissão para apagar este arquivo PDF.")

        except Documento.DoesNotExist:
            return JsonResponse({"success": False, "error": f"Documento não encontrado"}, status=404)
        
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=500)
        
        except:
            return JsonResponse({"success": False, "error": "Método não permitido"}, status=405)
        

######################### View para realizar testes com o modelo ########################################
class RunTestsView(View):
    def get(self, request):
        # Obtém dataframe das questões das provas
        df = pd.read_json(os.path.join(settings.BASE_DIR, "questions.json"))
        questoes_meio_ambiente = df["meio-ambiente"]
        questoes_gerais = df["geral"]
        
        NUM_QUESTOES_MEIO_AMB_ENADE = 16
        NUM_QUESTOES_MEIO_AMB_OAB = 14
        TOTAL_QUESTOES = 30

        # ------------------------------------------------------
        # TESTE 1 - Sabiá-3 puro com questões sobre meio ambiente
        # ------------------------------------------------------
        print("Iniciando o teste com sabiá puro...")
        teste1_acertos_OAB = 0
        teste1_acertos_ENADE = 0
        teste1_acertos_TOTAL = 0
        
        count = 0
        for questao in questoes_meio_ambiente:
            resultado = chama_sabia3(questao["questao"])
            resultado = resultado.upper()

            if resultado == questao["resposta"]:
                teste1_acertos_TOTAL += 1
                if questao["exame"] == "OAB":
                    teste1_acertos_OAB += 1
                else:
                    teste1_acertos_ENADE += 1

            count += 1
            print(count, end="  ")
        print("Teste 1 concluído com sucesso")

        carregar_documentos_no_retriever() # Carrega JSONs no retriever

        # ---------------------------------------------------------------------
        # TESTE 2 - Sabiá-3 com RAG ambiental com questões sobre meio ambiente
        # ---------------------------------------------------------------------
        print("Iniciando o teste com Sabiá-3 com RAG ambiental com questões sobre meio ambiente...")
        teste2_acertos_OAB = 0
        teste2_acertos_ENADE = 0
        teste2_acertos_TOTAL = 0

        count = 0
        for questao in questoes_meio_ambiente:
            resultado = chama_sabia3(questao["questao"], consultar_rag(questao["questao"]))
            resultado = resultado.upper()

            if resultado == questao["resposta"]:
                teste2_acertos_TOTAL += 1
                if questao["exame"] == "OAB":
                    teste2_acertos_OAB += 1
                else:
                    teste2_acertos_ENADE += 1
            
            count += 1
            print(count, end="  ")
        print("Teste 2 concluído com sucesso")

        # --------------------------------------------------------
        # TESTE 3 - Sabiá-3 com RAG ambiental com questões gerais
        # --------------------------------------------------------
        print("Iniciando o teste com Sabiá-3 com RAG ambiental com questões gerais...")
        teste3_acertos_TOTAL = 0

        count = 0
        for questao in questoes_gerais:
            resultado = chama_sabia3(questao["questao"], consultar_rag(questao["questao"]))
            resultado = resultado.upper()

            if resultado == questao["resposta"]:
                teste3_acertos_TOTAL += 1
            
            count += 1
            print(count, end="  ")
        print("Teste 3 concluído com sucesso")

        path = os.path.join(settings.BASE_DIR, "resultados_testes.csv")
        with open(path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)

            for i in range(1, 4):
                # Cabeçalho do teste
                writer.writerow([f"Teste {i}"])

                if i != 3:
                    writer.writerow(["Resultados", "Total", "Total (%)", "Questões ENADE", "Questões ENADE (%)", "Questões OAB", "Questões OAB (%)"])
                    
                    if i == 1:
                        writer.writerow(
                            "Acertos", 
                            f"{teste1_acertos_TOTAL}", 
                            f"{(teste1_acertos_TOTAL / TOTAL_QUESTOES) * 100}", 
                            f"{teste1_acertos_ENADE}", 
                            f"{(teste1_acertos_ENADE / NUM_QUESTOES_MEIO_AMB_ENADE) * 100}"
                            f"{teste1_acertos_OAB}",
                            f"{(teste1_acertos_OAB / NUM_QUESTOES_MEIO_AMB_OAB) * 100}"
                        )
                        writer.writerow(
                            "Erros", 
                            f"{TOTAL_QUESTOES - teste1_acertos_TOTAL}", 
                            f"{((TOTAL_QUESTOES - teste1_acertos_TOTAL) / TOTAL_QUESTOES) * 100}", 
                            f"{NUM_QUESTOES_MEIO_AMB_ENADE - teste1_acertos_ENADE}", 
                            f"{((NUM_QUESTOES_MEIO_AMB_ENADE - teste1_acertos_ENADE) / NUM_QUESTOES_MEIO_AMB_ENADE) * 100}"
                            f"{NUM_QUESTOES_MEIO_AMB_OAB - teste1_acertos_OAB}",
                            f"{((NUM_QUESTOES_MEIO_AMB_OAB - teste1_acertos_OAB) / NUM_QUESTOES_MEIO_AMB_OAB) * 100}"
                        )
                    else:
                        writer.writerow(
                            "Acertos", 
                            f"{teste2_acertos_TOTAL}", 
                            f"{(teste2_acertos_TOTAL / TOTAL_QUESTOES) * 100}", 
                            f"{teste2_acertos_ENADE}", 
                            f"{(teste2_acertos_ENADE / NUM_QUESTOES_MEIO_AMB_ENADE) * 100}"
                            f"{teste2_acertos_OAB}",
                            f"{(teste2_acertos_OAB / NUM_QUESTOES_MEIO_AMB_OAB) * 100}"
                        )
                        writer.writerow(
                            "Erros", 
                            f"{TOTAL_QUESTOES - teste2_acertos_TOTAL}", 
                            f"{((TOTAL_QUESTOES - teste2_acertos_TOTAL) / TOTAL_QUESTOES) * 100}", 
                            f"{NUM_QUESTOES_MEIO_AMB_ENADE - teste2_acertos_ENADE}", 
                            f"{((NUM_QUESTOES_MEIO_AMB_ENADE - teste2_acertos_ENADE) / NUM_QUESTOES_MEIO_AMB_ENADE) * 100}"
                            f"{NUM_QUESTOES_MEIO_AMB_OAB - teste2_acertos_OAB}",
                            f"{((NUM_QUESTOES_MEIO_AMB_OAB - teste2_acertos_OAB) / NUM_QUESTOES_MEIO_AMB_OAB) * 100}"
                        )

                else:
                    writer.writerow(["Resultados", "Total", "Total (%)"])
                    writer.writerow(
                        "Acertos",
                        f"{teste3_acertos_TOTAL}"
                        f"{(teste3_acertos_TOTAL / TOTAL_QUESTOES) * 100}", 
                    )
                    writer.writerow(
                        "Erros",
                        f"{TOTAL_QUESTOES - teste3_acertos_TOTAL}"
                        f"{((TOTAL_QUESTOES - teste3_acertos_TOTAL) / TOTAL_QUESTOES) * 100}", 
                    )

                writer.writerow([""])
        print("Arquivo .csv construído com sucesso!")
                

        return JsonResponse({"success": True})
