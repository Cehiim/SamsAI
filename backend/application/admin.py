from django.contrib import admin
from .models import Mensagem, Conversa, Documento

@admin.register(Conversa)
class ConversaAdmin(admin.ModelAdmin):
    list_display = ('pk', 'usuario', 'nome')

@admin.register(Mensagem)
class MensagemAdmin(admin.ModelAdmin):
    list_display = ('pk', 'conversa', 'inicio_texto', 'data', 'eh_do_usuario')

@admin.register(Documento)
class DocumentoAdmin(admin.ModelAdmin):
    list_display = ('pk', 'conversa', 'titulo', 'data')