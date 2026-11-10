from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from bot import gerar_resposta, em_crise

app = FastAPI(title="Evolua - Chat")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class Mensagem(BaseModel):
    texto: str


@app.get("/")
def raiz():
    return {"status": "Evolua no ar"}


@app.post("/chat")
def chat(msg: Mensagem):
    return {
        "resposta": gerar_resposta(msg.texto),
        "alerta": em_crise(msg.texto),
    }