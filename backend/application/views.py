from django.shortcuts import render
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

class CadastroView(View):
    def get(self, request):
        return render(request, 'cadastro.html')
        
    def post(self, request):
        try:
            username = request.POST.get("nome")
            email = request.POST.get("email")
            senha1 = request.POST.get("senha1")
            senha2 = request.POST.get("senha2")

            ###Elaborar métodos de validação melhores nas views no front###
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
        mensagens = conversa_atual.mensagens.all()
        todas_as_conversas = Conversa.objects.filter(usuario=usuario).order_by('-data')
        
        context = {
            "usuario": usuario,
            "mensagens": mensagens,
            "conversa_atual": conversa_atual,
            "todas_as_conversas": todas_as_conversas
        }

        return render(request, 'chat.html', context)


class NewChatBotView(LoginRequiredMixin, View):
    def get(self, request):
        usuario = User.objects.get(pk=request.user.pk)
        todas_as_conversas = Conversa.objects.filter(usuario=usuario).order_by('-data')
        context = {
            "usuario": usuario,
            "conversas": todas_as_conversas
        }
        return render(request, "chat.html", context)
    
    def post(self, request):
        usuario = User.objects.get(pk=request.user.pk)
        conteudo_mensagem = request.POST.get("mensagem_usuario") #extrai conteúdo da mensagem

        if len(conteudo_mensagem) > 20:
            nome_conversa = conteudo_mensagem[:20] + "..."
        else:
            nome_conversa = conteudo_mensagem

        nova_conversa = Conversa(usuario=usuario, nome=nome_conversa) #Cria nova conversa
        nova_conversa.save()
        nova_mensagem = Mensagem(conversa=nova_conversa, texto=conteudo_mensagem) #Cria nova mensagem
        nova_mensagem.save()

        return HttpResponseRedirect(reverse("chat", args=[nova_conversa.pk]))
    
    