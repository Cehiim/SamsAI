from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin
from .models import Mensagem, Conversa


@admin.register(Conversa)
class ConversaAdmin(admin.ModelAdmin):
    list_display = ('pk', 'usuario', 'nome')

@admin.register(Mensagem)
class MnesagemAdmin(admin.ModelAdmin):
    list_display = ('pk', 'conversa', 'inicio_texto', 'data', 'eh_do_usuario')