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
            return HttpResponseRedirect(reverse('chat', args=[request.user.pk]))
        
        usuarios = User.objects.all()

        context = {
            "usuarios": usuarios
        }
        return render(request, 'login.html', context)

    def post(self, request):
        if request.user.is_authenticated:
            return HttpResponseRedirect(reverse('chat', args=[request.user.pk]))

        try:
            email = request.POST.get("email")
            senha = request.POST.get("senha")
            usuario = User.objects.get(email=email)

            if usuario is not None and usuario.is_active and check_password(senha, usuario.password):
                login(request, usuario)
                return HttpResponseRedirect(reverse('chat', args=[request.user.pk]))
            else:
                messages.error(request, "email ou senha incorretos")
        
        except Exception as e:
            messages.error(request, "email ou senha incorretos")
        
        return render(request, "login.html")

class CadastroView(View):
    def get(self, request):
        return render(request, 'cadastro.html')
        
    def post(self, request):
        pass

class ChatBotView(LoginRequiredMixin, View):
    def get(self, request, conversa_id):
        if not request.user.is_authenticated:
            return HttpResponseRedirect(reverse('login'))
        
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
    def get(self, request, conversa_id):
        if not request.user.is_authenticated:
            return HttpResponseRedirect(reverse('login'))