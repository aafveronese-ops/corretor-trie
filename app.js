import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAb2QU5HBiHSepGHDaYudlVowiQ8x6sQSI",
  authDomain: "corretor-trie.firebaseapp.com",
  databaseURL: "https://corretor-trie-default-rtdb.firebaseio.com",
  projectId: "corretor-trie",
  storageBucket: "corretor-trie.firebasestorage.app",
  messagingSenderId: "704182814324",
  appId: "1:704182814324:web:4578b37dcdfd349854b321",
  measurementId: "G-G7779HF42T"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- Trie em JavaScript ---
class No {
  constructor() {
    this.filhos = {};
    this.fimDePalavra = false;
  }
}

class Trie {
  constructor() {
    this.raiz = new No();
  }

  inserir(palavra) {
    let atual = this.raiz;
    for (const letra of palavra) {
      if (!atual.filhos[letra]) atual.filhos[letra] = new No();
      atual = atual.filhos[letra];
    }
    atual.fimDePalavra = true;
  }

  sugestoes(prefixo) {
    let atual = this.raiz;
    for (const letra of prefixo) {
      if (!atual.filhos[letra]) return [];
      atual = atual.filhos[letra];
    }
    const resultado = [];
    this._coletar(atual, prefixo, resultado);
    return resultado;
  }

  _coletar(no, palavraAtual, resultado) {
    if (no.fimDePalavra) resultado.push(palavraAtual);
    for (const [letra, filho] of Object.entries(no.filhos)) {
      this._coletar(filho, palavraAtual + letra, resultado);
    }
  }
}

// --- Palavras do dicionário ---
const palavras = [
  "programação", "processo", "professor", "produto", "projeto",
  "problema", "prova", "proteção",
  "casa", "casamento", "casaco", "caso",
  "banana", "band", "banco",
  "sol", "sola", "sono", "sorte", "teste", "buceta", "corinthians"
];

const trie = new Trie();

// Insere as palavras direto na Trie — funciona sem depender do Firebase
palavras.forEach(p => trie.inserir(p));
document.getElementById("totalPalavras").textContent = palavras.length;

// Salva no Firebase em segundo plano (sem bloquear nada)
const dbRef = ref(db, "dicionario/palavras");
set(dbRef, palavras).catch(() => {});

// --- Interação ---
const input = document.getElementById("inputPalavra");
const suggestionsEl = document.getElementById("suggestions");
const totalSugestoesEl = document.getElementById("totalSugestoes");

input.addEventListener("input", () => {
  const prefixo = input.value.trim().toLowerCase();
  suggestionsEl.innerHTML = "";

  if (!prefixo) {
    totalSugestoesEl.textContent = "0";
    suggestionsEl.innerHTML = '<span class="empty">Comece a digitar para ver sugestões...</span>';
    return;
  }

  const sugs = trie.sugestoes(prefixo);
  totalSugestoesEl.textContent = sugs.length;

  if (sugs.length === 0) {
    suggestionsEl.innerHTML = '<span class="empty">Nenhuma palavra encontrada.</span>';
    return;
  }

  sugs.forEach(palavra => {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.textContent = palavra;
    chip.style.cursor = "pointer";
    chip.addEventListener("click", () => {
      input.value = palavra;
      suggestionsEl.innerHTML = '<span class="empty">Comece a digitar para ver sugestões...</span>';
      totalSugestoesEl.textContent = "0";
    });
    suggestionsEl.appendChild(chip);
  });
});
