from django.shortcuts import redirect, render
from django.views import View
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse, Http404
from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse
from django.contrib.auth import login, logout
from .models import *
from django.contrib.auth.hashers import check_password
from django.contrib import messages
from django.core.exceptions import ValidationError
from django.core import serializers
import json
import openai
from decouple import config

class LoginView(View):
    def get(self, request):
        if request.user.is_authenticated:
            return HttpResponseRedirect(reverse('new_chat'))
        
        usuarios = Usuario.objects.all()

        context = {
            "usuarios": usuarios
        }
        return render(request, 'login.html', context)

    def post(self, request):
        if request.user.is_authenticated:
            return HttpResponseRedirect(reverse('new_chat'))

        try:
            email = request.POST.get("email")
            senha = request.POST.get("senha")
            usuario = Usuario.objects.get(email=email)

            if usuario is None:
                messages.error(request, "Email não cadastrado ou incorreto")
                return render(request, "login.html")
            
            if not check_password(senha, usuario.password) and usuario.is_active:
                messages.error(request, "Senha incorreta")
                return render(request, "login.html")

            login(request, usuario)
            return HttpResponseRedirect(reverse('new_chat'))
        
        except Exception as e:
            messages.error(request, "Email não cadastrado ou incorreto")
        
        return render(request, "login.html")
    
class LogoutView(LoginRequiredMixin, View):
    def get(self, request):
        if request.user.is_authenticated:
            logout(request)
        return HttpResponseRedirect(reverse("login"))

class CadastroView(View):
    def get(self, request):
        return render(request, 'cadastro.html')
        
    def post(self, request):
        try:
            username = request.POST.get("nome")
            email = request.POST.get("email")
            senha1 = request.POST.get("senha1")
            senha2 = request.POST.get("senha2")

            ###TODO: Elaborar métodos de validação melhores nas views no front###
            if username != "" and email != "" and senha1 == senha2: 
                novo_usuario = Usuario(username=username, email=email)
                novo_usuario.set_password(senha1)
                novo_usuario.save()
                login(request, novo_usuario)
                return HttpResponseRedirect(reverse('new_chat'))
            else:
                messages.error(request, "Não foi possível realizar o cadastro. Verifique os dados e tente novamente")
                return render(request, "cadastro.html")
            
        except:
            messages.error(request, "Não foi possível realizar o cadastro. Verifique os dados e tente novamente")
            return render(request, "cadastro.html")


class ChatBotView(LoginRequiredMixin, View):
    def get(self, request, conversa_id):
        try:    
            conversa_atual = Conversa.objects.get(pk=conversa_id)
            if conversa_atual.usuario != request.user:
                raise Http404("Conversa não encontrada")
        except Conversa.DoesNotExist:
            raise Http404("Conversa não encontrada")
        
        usuario = request.user

        queryset_conversas = Conversa.objects.filter(usuario=usuario).order_by('-data')
        todas_as_conversas = serializers.serialize('json', queryset_conversas)
        todas_as_conversas = json.dumps(todas_as_conversas)

        queryset_mensagens = conversa_atual.mensagens.all()
        mensagens = serializers.serialize('json', queryset_mensagens)
        mensagens = json.dumps(mensagens) 

        context = {
            "usuario": usuario,
            "mensagens": mensagens,
            "conversa_atual": conversa_atual,
            "conversa_id": conversa_id,
            "todas_as_conversas": todas_as_conversas
        }
        return render(request, 'chat.html', context)
    
    def post(self, request, conversa_id): # TODO: (AJAX) Arranjar um jeito melhor de renderizar as conversas      
        try:
            data = json.loads(request.body)
            conversa_atual = Conversa.objects.get(pk=conversa_id)
            if conversa_atual.usuario != request.user:
                return JsonResponse({"success": False, "error": "Conversa não encontrada"}, status=404)

            conteudo_mensagem_usuario = data.get("message") #extrai conteúdo da mensagem

            nova_mensagem_usuario = Mensagem(conversa=conversa_atual, texto=conteudo_mensagem_usuario) #Cria nova mensagem
            nova_mensagem_usuario.save()

            client = openai.OpenAI(
                api_key=config('API_KEY'),
                base_url="https://chat.maritaca.ai/api"
            )

            response = client.chat.completions.create(
              model="sabia-3",
              messages=[
                {"role": "user", "content": conteudo_mensagem_usuario},
              ],
              max_tokens=8000
            )
            mensagem_IA = response.choices[0].message.content 

            nova_mensagem_IA = Mensagem(conversa=conversa_atual, texto=mensagem_IA, eh_do_usuario=False) #Salva resposta da IA
            nova_mensagem_IA.save()

            return JsonResponse({"success": True, "message": mensagem_IA}, status=200)
        
        except Conversa.DoesNotExist:
            return JsonResponse({"success": False, "error": "Conversa não encontrada"}, status=404)
        
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=500)
        
        except:
            return JsonResponse({"success": False, "error": "Método não permitido"}, status=405)


class NewChatBotView(LoginRequiredMixin, View):
    def get(self, request):
        usuario = request.user
        
        queryset_conversas = Conversa.objects.filter(usuario=usuario).order_by('-data')
        todas_as_conversas = serializers.serialize('json', queryset_conversas)
        todas_as_conversas = json.dumps(todas_as_conversas)

        context = {
            "usuario": usuario,
            "todas_as_conversas": todas_as_conversas,
            "conversa_id": None,
        }
        return render(request, "chat.html", context)
    
    def post(self, request):
        usuario = request.user
        data = json.loads(request.body)
        conteudo_mensagem_usuario = data.get("message") #extrai conteúdo da mensagem

        if len(conteudo_mensagem_usuario) >= 1:
            if len(conteudo_mensagem_usuario) > 20:
                nome_conversa = conteudo_mensagem_usuario[:20] + "..."
            else:
                nome_conversa = conteudo_mensagem_usuario
            
            nova_conversa = Conversa(usuario=usuario, nome=nome_conversa) #Cria nova conversa
            nova_conversa.save()
            nova_mensagem = Mensagem(conversa=nova_conversa, texto=conteudo_mensagem_usuario) #Cria nova mensagem
            nova_mensagem.save()
            
            client = openai.OpenAI(
                api_key=config('API_KEY'),
                base_url="https://chat.maritaca.ai/api"
            )

            response = client.chat.completions.create(
              model="sabia-3",
              messages=[
                {"role": "user", "content": conteudo_mensagem_usuario},
              ],
              max_tokens=8000
            )
            mensagem_IA = response.choices[0].message.content 

            nova_mensagem_IA = Mensagem(conversa=nova_conversa, texto=mensagem_IA, eh_do_usuario=False) #Salva resposta da IA
            nova_mensagem_IA.save()

            redirect_url = reverse('chat', args=[nova_conversa.pk])
            return JsonResponse({'success': True, "message": mensagem_IA, 'Nova conversa': f"{nome_conversa} criada com sucesso!", 'redirect': redirect_url})
        
        else:
            return JsonResponse({"success": False, "error": "Mensagem inválida"})

            
class RenameView(LoginRequiredMixin, View):
    def post(self, request, conversa_id):
        try:
            data = json.loads(request.body)
            conversa = Conversa.objects.get(pk=conversa_id)

            if conversa.usuario != request.user:
                raise JsonResponse({"success": False, "error": "Conversa não encontrada"}, status=404)

            conversa.nome = data.get("nome", conversa.nome)
            conversa.save()

            return JsonResponse({"success": True, f"message": f"Conversa renomeada com sucesso!"}, status=200)

        except Conversa.DoesNotExist:
            return JsonResponse({"success": False, "error": "Conversa não encontrada"}, status=404)
        
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=500)
        
        except:
            return JsonResponse({"success": False, "error": "Método não permitido"}, status=405)

class DeleteView(LoginRequiredMixin, View):
    def post(self, request, conversa_id):
        try:
            conversa_delete = Conversa.objects.get(pk=conversa_id)

            if conversa_delete.usuario != request.user:
                raise JsonResponse({"success": False, "error": "Conversa não encontrada"}, status=404)

            conversa_delete_nome = conversa_delete.nome
            conversa_delete.delete()
            
            return JsonResponse({"success": True, "message": f"Conversa '{conversa_delete_nome}' deletada com sucesso!"}, status=200)
        
        except Conversa.DoesNotExist:
            return JsonResponse({"success": False, "error": f"Conversa '{conversa_delete_nome}' não encontrada"}, status=404)
        
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=500)
        
        except:
            return JsonResponse({"success": False, "error": "Método não permitido"}, status=405)

class UploadView(LoginRequiredMixin, View):
    def post(self, request, conversa_id):
        try:
            conversa = Conversa.objects.get(pk=conversa_id)
            arquivo = request.FILES["arquivo"]
            documento = Documento.objects.create(titulo=str(arquivo), arquivo=arquivo, conversa=conversa)

            return JsonResponse({'success': True, 'message': 'Upload feito com sucesso!'})
        
        except Conversa.DoesNotExist:
            return JsonResponse({"success": False, "error": f"Conversa '{conversa.nome}' não encontrada"}, status=404)
        
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=500)
        
        except:
            return JsonResponse({"success": False, "error": "Método não permitido"}, status=405)

class ChangePromptView(LoginRequiredMixin, View):
    def post(self, request):
        pass


            
            
    