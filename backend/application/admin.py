from django.contrib import admin
from .models import Usuario, Mensagem, Conversa, Documento
from django.contrib.auth.admin import UserAdmin

@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    list_display = ('pk', 'username', 'is_superuser', 'prompt_instrucao')

@admin.register(Conversa)
class ConversaAdmin(admin.ModelAdmin):
    list_display = ('pk', 'usuario', 'nome')

@admin.register(Mensagem)
class MensagemAdmin(admin.ModelAdmin):
    list_display = ('pk', 'conversa', 'inicio_texto', 'data', 'eh_do_usuario')

@admin.register(Documento)
class DocumentoAdmin(admin.ModelAdmin):
    list_display = ('pk', 'mensagem', 'titulo', 'data')