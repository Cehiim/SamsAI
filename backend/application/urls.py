from django.urls import path
from .views import *

urlpatterns = [
    path('', LoginView.as_view(), name='login'),
    path("logout", LogoutView.as_view(), name='logout'),
    path('chat/<int:conversa_id>', ChatBotView.as_view(), name="chat"),
    path('chat/new', NewChatBotView.as_view(), name='new_chat'),
    path('cadastro', CadastroView.as_view(), name='cadastro'),
]