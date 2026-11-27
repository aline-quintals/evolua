from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


import db
from bot import gerar_resposta, em_crise, resposta_de_seguranca

app = FastAPI(title="Evolua - Chat")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

db.iniciar()

class Mensagem(BaseModel):
    texto: str
    sessao:str  


@app.get("/")
def raiz():
    return {"status": "Evolua no ar"}


@app.post("/chat")
def chat(msg: Mensagem):
    # O bot olha o que já foi conversado nesta sessão (últimas 40 mensagens)
    historico = db.listar(msg.sessao)[-40:]

    resposta = gerar_resposta(msg.texto, historico)
    alerta = em_crise(msg.texto) or resposta_de_seguranca(resposta)

    db.salvar(msg.sessao, "eu", msg.texto)
    db.salvar(msg.sessao, "bot", resposta, alerta)

    return {"resposta": resposta, "alerta": alerta}

@app.get("/historico")
def consultar_historico(sessao: str):
    """Só consulta. Nunca altera nada."""
    return db.listar(sessao)


@app.delete("/historico")
def apagar_historico(sessao: str):
    """Só apaga o histórico da sessão informada."""
    db.apagar(sessao)
    return {"status": "histórico apagado"}