from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinLengthValidator

class Usuario(AbstractUser):
    prompt_instrucao = models.TextField("Prompt de Instrução")

    def __str__(self):
        return self.username

class Conversa(models.Model):
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name="conversas")
    nome = models.CharField("Nome", max_length=30, validators=[MinLengthValidator(1)])
    data = models.DateTimeField("Data e horário de criação da mensagem", auto_now_add=True)

    def __str__(self):
        return self.nome
    
    class Meta:
        verbose_name = "Conversa"
        verbose_name_plural = "Conversas"

class Mensagem(models.Model):
    conversa = models.ForeignKey(Conversa, on_delete=models.CASCADE, related_name="mensagens")
    texto = models.TextField("Texto", max_length=10000, validators=[MinLengthValidator(1)])
    data = models.DateTimeField("Data e horário da mensagem", auto_now_add=True)
    eh_do_usuario = models.BooleanField("Mensagem do usuário?", default=True)

    def inicio_texto(self):
        return self.texto[:30] + "..." if len(self.texto) > 30 else self.texto  

    def __str__(self):
        return self.texto[:10] + "..."
    
    class Meta:
        verbose_name = "Mensagem"
        verbose_name_plural = "Mensagens"

class Documento(models.Model):
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name="documentos")
    mensagem = models.OneToOneField(Mensagem, null=True, blank=True, on_delete=models.CASCADE, related_name="documento")
    titulo = models.CharField(max_length=100)
    arquivo = models.FileField(upload_to='upload')
    data = models.DateTimeField("Data e horário do upload", auto_now_add=True)

    def __str__(self):
        return self.titulo
    
    class Meta:
        verbose_name = "Documento"
        verbose_name_plural = "Documentos"

class DocumentoJSON(models.Model):
    titulo = models.CharField(max_length=255)
    conteudo = models.JSONField()

    def __str__(self):
        return self.titulo
    
    class Meta:
        verbose_name = "Documento JSON"
        verbose_name_plural = "Documentos JSON"

