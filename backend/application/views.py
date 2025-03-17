from django.shortcuts import redirect, render
from django.views import View
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.contrib.auth.mixins import LoginRequiredMixin
from django.urls import reverse
from django.contrib.auth import login, logout
from .models import *
from django.contrib.auth.models import User
from django.contrib.auth.hashers import check_password
from django.contrib import messages
from django.core.exceptions import ValidationError
from django.core import serializers
import json

class LoginView(View):
    def get(self, request):
        if request.user.is_authenticated:
            return HttpResponseRedirect(reverse('new_chat'))
        
        usuarios = User.objects.all()

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
            usuario = User.objects.get(email=email)

            if usuario is not None and usuario.is_active and check_password(senha, usuario.password):
                login(request, usuario)
                return HttpResponseRedirect(reverse('new_chat'))
            else:
                messages.error(request, "email ou senha incorretos")
        
        except Exception as e:
            messages.error(request, "email ou senha incorretos")
        
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
                novo_usuario = User(username=username, email=email)
                novo_usuario.set_password(senha1)
                novo_usuario.save()
                login(request, novo_usuario)
                return HttpResponseRedirect(reverse('new_chat'))
            
        except:
            messages.error(request, "Não foi possível realizar o cadastro. Verifique os dados e tente novamente")
            return render(request, "cadastro.html")


class ChatBotView(LoginRequiredMixin, View):
    def get(self, request, conversa_id):    
        conversa_atual = Conversa.objects.get(pk=conversa_id)
        usuario = conversa_atual.usuario

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
        conversa_atual = Conversa.objects.get(pk=conversa_id)
        conteudo_mensagem = request.POST.get("mensagem_usuario") #extrai conteúdo da mensagem

        nova_mensagem = Mensagem(conversa=conversa_atual, texto=conteudo_mensagem) #Cria nova mensagem
        nova_mensagem.save()
        
        return redirect('chat', conversa_id=conversa_id)


class NewChatBotView(LoginRequiredMixin, View):
    def get(self, request):
        usuario = User.objects.get(pk=request.user.pk)
        
        queryset_conversas = Conversa.objects.filter(usuario=usuario).order_by('-data')
        todas_as_conversas = serializers.serialize('json', queryset_conversas)
        todas_as_conversas = json.dumps(todas_as_conversas)

        context = {
            "usuario": usuario,
            "todas_as_conversas": todas_as_conversas,
            "conversa_id": None
        }
        return render(request, "chat.html", context)
    
    def post(self, request):
        usuario = User.objects.get(pk=request.user.pk)
        conteudo_mensagem = request.POST.get("mensagem_usuario") #extrai conteúdo da mensagem

        if len(conteudo_mensagem) >= 1:
            if len(conteudo_mensagem) > 20:
                nome_conversa = conteudo_mensagem[:20] + "..."
            else:
                nome_conversa = conteudo_mensagem
            
            nova_conversa = Conversa(usuario=usuario, nome=nome_conversa) #Cria nova conversa
            nova_conversa.save()
            nova_mensagem = Mensagem(conversa=nova_conversa, texto=conteudo_mensagem) #Cria nova mensagem
            nova_mensagem.save()
            
            return HttpResponseRedirect(reverse("chat", args=[nova_conversa.pk]))

        else: #TODO: Botão de enviar no front fica inativo quando o tamanho da mensagem é menor que 1 caractere
            
            queryset_conversas = Conversa.objects.filter(usuario=usuario).order_by('-data')
            todas_as_conversas = serializers.serialize('json', queryset_conversas)
            todas_as_conversas = json.dumps(todas_as_conversas)

            context = {
                "usuario": usuario,
                "todas_as_conversas": todas_as_conversas,
                "conversa_id": None
            }
            return render(request, 'chat.html', context)
            
class RenameView(LoginRequiredMixin, View):
    def post(self, request, conversa_id):
        try:
            data = json.loads(request.body)
            conversa = Conversa.objects.get(pk=conversa_id)
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
            conversa_delete_nome = conversa_delete.nome
            conversa_delete.delete()
            
            return JsonResponse({"success": True, "message": f"Conversa '{conversa_delete_nome}' deletada com sucesso!"}, status=200)
        
        except Conversa.DoesNotExist:
            return JsonResponse({"success": False, "error": f"Conversa '{conversa_delete_nome}' não encontrada"}, status=404)
        
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=500)
        
        except:
            return JsonResponse({"success": False, "error": "Método não permitido"}, status=405)
        

            
            
    