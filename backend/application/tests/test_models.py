import pytest
from application.models import Usuario, Conversa, Mensagem, Documento
from django.db import DataError
from django.core.exceptions import ValidationError

@pytest.mark.django_db
def test_cria_usuario():
    usuario = Usuario.objects.create(username="João da Silva", email="joao@hotmail.com")
    usuario.prompt_instrucao = "Hello, World!"

    assert usuario.username == "João da Silva"
    assert usuario.email == "joao@hotmail.com"
    assert usuario.prompt_instrucao == "Hello, World!"

@pytest.mark.django_db
def test_cria_conversa():
    usuario = Usuario.objects.create(username="João da Silva", email="joao@hotmail.com")
    conversa = Conversa.objects.create(usuario=usuario, nome="ChatGPT")

    assert conversa.usuario == usuario
    assert conversa.nome == "ChatGPT"
    
    conversa3 = Conversa.objects.create(usuario=usuario, nome="a")

    with pytest.raises(ValidationError):
        conversa2 = Conversa(usuario=usuario, nome="")
        conversa2.full_clean()
        conversa2.save()

    with pytest.raises(DataError):
        conversa4 = Conversa.objects.create(usuario=usuario, nome="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
    


    
