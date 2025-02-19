from bs4 import BeautifulSoup
import requests
import pandas as pd
from datetime import date

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
}

page_to_scope = requests.get("https://www.planalto.gov.br/ccivil_03/_Ato2011-2014/2012/Lei/L12651.htm", headers=headers)
soup = BeautifulSoup(page_to_scope.text, "html.parser")

##### Informação da Lei ############
lei_info = soup.find("a")
lei_info_list = lei_info.text.strip().split(" ")
numero_lei = int(lei_info_list[2].replace(".", "").replace(",", ""))
ano_lei = int(lei_info_list[-1].replace(".", ""))

meses = [
    "JANEIRO",
    "FEVEREIRO",
    "MARÇO",
    "ABRIL",
    "MAIO",
    "JUNHO",
    "JULHO",
    "AGOSTO",
    "SETEMBRO",
    "OUTUBRO",
    "NOVEMBRO",
    "DEZEMBRO"
]

dia_lei = int(lei_info_list[4])
mes_lei = meses.index(lei_info_list[-3]) + 1
data_lei = date(ano_lei, mes_lei, dia_lei)
p_tag = soup.find("p", attrs={"class":"MsoNormal", "style": "text-indent:0"})
if p_tag:
    presidente = p_tag.find("span").text.strip()

else:
    presidente = "Não encontrado"

descricao = soup.find("span", style="color: #800000").text.strip()

############# Capítulos #####################
capitulos_soup = soup.findAll("p", attrs={"class":"cabea", "style":"text-align: center; "})
#capitulos_soup_a = soup.findAll("a", text="CAPÍTULO") #TODO: Colocar os capítulos III-A

capitulos = {}
i  = 0
while i < len(capitulos_soup):
    if "CAPÍTULO" in capitulos_soup[i].text.strip():
        numero = capitulos_soup[i].text.strip()[9:]
        print(numero)
        i += 1
        capitulos[numero] = capitulos_soup[i].text.strip()
    i += 1
for key in capitulos:
    print(key, capitulos[key])

