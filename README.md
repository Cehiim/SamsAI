# Passo a passo para configuração do ambiente virtual

## 1 Clone o repositório
```
git clone git@github.com:Cehiim/SamsAI.git
```

## 2 Mude para a sua branch
```
git checkout Dallape
```

## 3 Entre na pasta backend e instale o ambiente virtual venv e ative-o
```
python3 -m venv venv
```

### No MacOS
```
source venv/bin/activate
```

### No Windows powershell
```
source venv/Scripts/Activate.ps1
```

### No Windows cmd
```
source venv/Scripts/Activate.bat
```

## 4 Instale todos os pacotes necessários
```
pip install -r requirements.txt
```

## 5 Crie um arquivo .env na mesma pasta e gere uma SECRET_KEY 
```
python
from django.core.management.utils import get_random_secret_key
print(get_random_secret_key())
```

## 6 Agora guarde a sua SECRET_KEY no .env
```
SECRET_KEY='sua senha secreta'
```

## 7 Coloque o arquivo db.sqlite3 dentro da pasta backend

## 8 Crie um novo super usuário
```
python manage.py createsuperuser
```

## 9 Agora rode o migrate e o servidor
```
python manage.py migrate
python manage.py runserver
```

