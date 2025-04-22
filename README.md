# Passo a passo para configuração do ambiente virtual

## Pré-requisitos:
 * PostgresSQL 17 ou superior
 * Python 3.12 ou superior
 * (opcional) PgAdmin4 (permite criar mais facilmente e visualizar o banco de dados por uma interface gráfica)

## 1) Crie um banco de dados com o Postgres e um usuário e senha (esse passo pode ser feito no PgAdmin4)
```
sudo -i -u postgres
psql
CREATE DATABASE SamsAI;
CREATE USER meu_user WITH PASSWORD 'minha_senha';
ALTER ROLE meu_user SET client_encoding TO 'UTF8';
ALTER ROLE meu_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE meu_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE meuprojeto TO meu_user;
\q
```

## 2) Clone o repositório
```
git clone git@github.com:Cehiim/SamsAI.git
```

## 3) Mude para a sua branch
```
git checkout Dallape
```

## 4) Entre na pasta backend e instale o ambiente virtual venv e ative-o
```
python3 -m venv venv
```

### No Linux ou MacOS
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

## 5) Instale todos os pacotes necessários
```
pip install -r requirements.txt
```

## 6) Crie um arquivo .env na mesma pasta e gere uma SECRET_KEY 
```
python
from django.core.management.utils import get_random_secret_key
print(get_random_secret_key())
```

## 7) Agora o arquivo .env com as informações a seguir substituindo os respectivos valores
```
SECRET_KEY='sua senha secreta'

API_KEY="chave da API"

DB_NAME='SamsAI'
DB_USER='meu_user'
DB_PASSWORD='minha_senha'
DB_HOST='localhost'

DEBUG=True
```

## 8) Crie um novo super usuário
```
python manage.py createsuperuser
```

## 9) Agora rode o migrate e o servidor
```
python manage.py migrate
python manage.py runserver
```

# Configurando o Docker no ambiente de produção
## 0) Se você está apenas atualizando o código na instância, rode
```
docker-compose down --volumes --remove-orphans
docker-compose up -d
```

## 1) Se você estiver criando as imagens do zero, prepare-as com docker compose
```
docker-compose build --no-cache
```

## 2) Rode os containers em segundo plano
```
docker-compose up -d
```

### Se esse passo falhar, digite os comandos a seguir e tente de novo
```
docker-compose down --volumes --remove-orphans
docker image prune -a
```

## 3) Verifique os containers
```
docker ps
```
