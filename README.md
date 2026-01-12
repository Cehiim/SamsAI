# Passo a passo para configuração do ambiente virtual

## Pré-requisitos:
 * PostgresSQL 17 ou superior
 * Python 3.12 ou superior

## 1) Clone o repositório
```
git clone git@github.com:Cehiim/SamsAI.git
```

## 2) Entre na pasta backend e instale o ambiente virtual venv e ative-o
```
python3 -m venv venv
source venv/bin/activate
```

## 3) Atualize os pacotes
```
sudo apt update && sudo apt upgrade -y
```

## 4) Instale as dependências da biblioteca psycopg2 e para o postgres
```
sudo apt install -y libpq-dev gcc python3-dev
sudo apt install postgresql-client-common
sudo apt install -y postgresql-client-17
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

DB_NAME='nome-database'
DB_USER='meu_user'
DB_PASSWORD='minha_senha'
DB_HOST='endpoint_banco'

DEBUG=False
```
### Se tiver dificuldade para saber qual é o nome do banco de dados, provavelmente é postgres, realize um teste de conexão:
```
psql -h database-samsai.c4jqgs8q0mms.us-east-1.rds.amazonaws.com -U postgres -d postgres
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

## 10) Instale o docker e o docker compose
```
sudo snap install docker
sudo apt  install docker-compose
```

# Configurando o Docker no ambiente de produção
## 0) Se você está apenas atualizando o código na instância, rode
```
sudo docker-compose down --volumes --remove-orphans
sudo docker-compose up -d
```

## 1) Se você estiver criando as imagens do zero, prepare-as com docker compose
```
sudo docker-compose build --no-cache
```

## 2) Rode os containers em segundo plano
```
sudo docker-compose up -d
```

### Se esse passo falhar, digite os comandos a seguir e tente de novo
```
sudo docker-compose down --volumes --remove-orphans
sudo docker image prune -a
```

## 3) Verifique os containers
```
sudo docker ps
```
