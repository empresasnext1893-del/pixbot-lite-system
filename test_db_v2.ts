import { createClientAccount, createWallet } from './server/db';
import 'dotenv/config';

async function test() {
  try {
    const email = "teste_final_" + Date.now() + "@gmail.com";
    const id = await createClientAccount({
      name: "Teste Final",
      email: email,
      passwordHash: "hash_teste"
    });
    console.log("SUCESSO: Usuário criado com ID:", id, "E-mail:", email);
    await createWallet(id);
    console.log("SUCESSO: Carteira criada");
    process.exit(0);
  } catch (e) {
    console.error("ERRO NO TESTE:", e);
    process.exit(1);
  }
}
test();
