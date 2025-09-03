import pytest
from application.views import ( LoginView, 
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