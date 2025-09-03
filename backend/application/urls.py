from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from .views import (LoginView, 
                    LogoutView, 
                    ChatBotView, 
                    CadastroView, 
                    RenameView, 
                    DeleteView, 
                    ChangePromptView, 
                    csrf_token_view,
                    GetConversasView,
                    GetMensagensView,
                    GetDocumentosView,
                    ShowPDFView,
                    DeletePDFView
                    )

urlpatterns = [
    path('', LoginView.as_view(), name='login'),
    path("logout", LogoutView.as_view(), name='logout'),
    path('chat/<int:conversa_id>', ChatBotView.as_view(), name="chat"),
    path('chat/new', ChatBotView.as_view(), name='new_chat'),
    path('cadastro', CadastroView.as_view(), name='cadastro'),
    path('rename/<int:conversa_id>', RenameView.as_view(), name='rename'),
    path('delete/<int:conversa_id>', DeleteView.as_view(), name='delete'),
    path('change-prompt', ChangePromptView.as_view(), name='change-prompt'),
    path('csrf', csrf_token_view, name='csrf'),
    path('api/conversas', GetConversasView.as_view(), name='get-conversas'),
    path('api/mensagens/<int:conversa_id>', GetMensagensView.as_view(), name='get-mensagens'),
    path('api/documentos', GetDocumentosView.as_view(), name='get-documentos'),
    path('show-pdf/<int:file_id>', ShowPDFView.as_view(), name='show-pdf'),
    path('delete-pdf/<int:file_id>', DeletePDFView.as_view(), name='delete-pdf'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)