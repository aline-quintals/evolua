import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "evolua.db"


def conectar():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn
def iniciar():
    """Cria a tabela se ela ainda não existir."""
    conn = conectar()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS mensagens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sessao TEXT NOT NULL,
            autor TEXT NOT NULL,
            texto TEXT NOT NULL,
            alerta INTEGER NOT NULL DEFAULT 0,
            criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    conn.commit()
    conn.close()


def salvar(sessao: str, autor: str, texto: str, alerta: bool = False):
    conn = conectar()
    conn.execute(
        "INSERT INTO mensagens (sessao, autor, texto, alerta) VALUES (?, ?, ?, ?)",
        (sessao, autor, texto, int(alerta)),
    )
    conn.commit()
    conn.close()


def listar(sessao: str):
    conn = conectar()
    linhas = conn.execute(
        "SELECT autor, texto, alerta FROM mensagens WHERE sessao = ? ORDER BY id",
        (sessao,),
    ).fetchall()
    conn.close()
    return [
        {"autor": l["autor"], "texto": l["texto"], "alerta": bool(l["alerta"])}
        for l in linhas
    ]


def apagar(sessao: str):
    conn = conectar()
    conn.execute("DELETE FROM mensagens WHERE sessao = ?", (sessao,))
    conn.commit()
    conn.close()