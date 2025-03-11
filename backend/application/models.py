from django.db import models
from django.contrib.auth.models import User

class Conversa(models.Model):
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name="conversas")
    nome = models.CharField("Nome", max_length=30)
    data = models.DateTimeField("Data e horário de criação da mensagem", auto_now_add=True)

    def __str__(self):
        return self.nome
    
    class Meta:
        verbose_name = "Conversa"
        verbose_name_plural = "Conversas"

# Colocar limites de conversas e mensagens

class Mensagem(models.Model):
    conversa = models.ForeignKey(Conversa, on_delete=models.CASCADE, related_name="mensagens")
    texto = models.TextField("Texto", max_length=10000)
    data = models.DateTimeField("Data e horário da mensagem", auto_now_add=True)
    eh_do_usuario = models.BooleanField("Mensagem do usuário?", default=True)

    def inicio_texto(self):
        return self.texto[:30] + "..." if len(self.texto) > 30 else self.texto  

    def __str__(self):
        return self.texto[:10] + "..."
    
    class Meta:
        verbose_name = "Mensagem"
        verbose_name_plural = "Mensagens"