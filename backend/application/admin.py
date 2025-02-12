from django.contrib import admin
from .models import Mensagem, Conversa

@admin.register(Conversa)
class ConversaAdmin(admin.ModelAdmin):
    list_display = ('pk', 'usuario', 'nome')

@admin.register(Mensagem)
class MnesagemAdmin(admin.ModelAdmin):
    list_display = ('pk', 'conversa', 'inicio_texto', 'data', 'eh_do_usuario')