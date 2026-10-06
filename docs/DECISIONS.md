# Decisões do projeto

Registro das decisões tomadas onde o enunciado deixa margem. Cada uma vai para o README final.
Formato: decisão — motivo. Ao mudar uma decisão, edite aqui no mesmo PR.

## Produto e regras

| Tema                                   | Decisão                                                                          | Motivo                                                                        |
| -------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Fuso de "passado" e de horário         | Fuso de negócio fixo `America/Sao_Paulo` (env `BUSINESS_TIMEZONE`); banco em UTC | O servidor em produção roda em UTC; sem fuso explícito as regras erram em 3 h |
| Reservas encostadas (09–10 e 10–11)    | Permitidas; intervalo semiaberto `[início, fim)`                                 | Comportamento esperado de qualquer agenda                                     |
| Reserva no passado                     | Rejeita se `startsAt < now`                                                      | Literal do enunciado                                                          |
| Cancelamento                           | Soft cancel (`status = CANCELLED`, `cancelledAt`)                                | Mantém histórico; canceladas não bloqueiam horário                            |
| Quem cancela                           | Somente o dono, inclusive para admin                                             | O enunciado diz "apenas as próprias"                                          |
| Cancelar reserva já iniciada           | Não permitido                                                                    | Não libera nada e distorce o histórico                                        |
| Excluir sala                           | Não existe; admin desativa (`isActive`)                                          | Exclusão quebraria o histórico de reservas                                    |
| Recursos das salas                     | Catálogo fixo no seed; admin marca quais a sala tem                              | CRUD de recursos não foi pedido                                               |
| Filtro com vários recursos             | A sala precisa ter todos                                                         | Expectativa natural de quem marca dois filtros                                |
| Granularidade de horário               | UI em passos de 15 min; servidor aceita qualquer minuto                          | Não inventar regra que o enunciado não pede                                   |
| Mensagem de conflito                   | Mostra o horário ocupado, não quem reservou                                      | Evita vazamento de dados entre usuários                                       |
| Acesso de não-admin a `/admin`         | Responde 404 (`notFound()`)                                                      | Não revela que a área existe                                                  |
| "Trocar usuário" × "Sair"              | Trocar abre `/sign-in` mantendo a sessão; Sair apaga o cookie                    | Duas ações com efeitos distintos; trocar não obriga a sair antes              |
| `/sign-in` com sessão ativa            | Mostra a lista com o usuário atual marcado, sem redirecionar                     | É o destino de "Trocar usuário"                                               |
| Ocupação do dia na tela de reserva     | Mostra só os horários ocupados, sem título nem dono                              | Mesmo critério da mensagem de conflito                                        |
| Conflito antes do envio                | Aviso visual com a mesma regra do servidor; o botão continua habilitado          | O servidor decide; a prévia pode estar desatualizada                          |
| Seletor de horário                     | Dia inteiro (00:00–23:45) em passos de 15 min                                    | Ainda não há regra de horário comercial                                       |
| Data inválida na URL da reserva        | Usa hoje                                                                         | Link editado à mão não deve virar tela de erro                                |
| Aviso de sucesso após reservar         | Action redireciona com `?created=1`; a página de destino mostra o toast          | Toast disparado antes de um `redirect()` no servidor se perde na navegação    |
| Filtro inválido na URL                 | Cada filtro é validado à parte; valor inválido é ignorado                        | Link editado à mão não vira tela de erro nem descarta os filtros válidos      |
| Recurso inexistente no filtro          | Slug fora do catálogo é descartado antes da consulta                             | Senão a lista ficaria vazia sem nenhum filtro marcado que explicasse          |
| Duração da reserva                     | Calculada em minutos exatos (ms ÷ 60 000), sem arredondar                        | `differenceInMinutes` trunca: 240 min 30 s passaria como 240                  |
| Reserva em andamento                   | Fica em "Próximas" com selo "Em andamento", sem botão de cancelar                | Ainda não terminou, mas já não pode ser cancelada                             |
| "Anteriores" em Minhas reservas        | Últimas 20 já terminadas, da mais recente para a mais antiga                     | Histórico longo não ajuda nessa tela; sem paginação por ora                   |
| Ordem das checagens ao cancelar        | Dono primeiro (`FORBIDDEN`), depois status e início                              | Outro usuário não descobre se a reserva alheia já foi cancelada ou começou    |
| Aviso de sucesso ao cancelar           | Toast disparado no cliente, sem redirect                                         | A página continua a mesma; só a lista é revalidada                            |
| Desativar sala com reservas futuras    | As reservas continuam valendo; a sala só deixa de aceitar novas                  | Não há regra pedida; o dono ainda pode cancelar                               |
| Nome de sala repetido                  | Único no banco, após trim e sensível a maiúsculas (`NAME_TAKEN` no campo)        | A constraint do banco decide, inclusive em salvamentos simultâneos            |
| Tamanho dos campos da sala             | Nome e local até 60 caracteres, descrição até 500, capacidade inteira ≥ 1        | Limites de bom senso; o formulário espelha o schema                           |
| Recurso fora do catálogo no formulário | Rejeitado com `VALIDATION_ERROR`                                                 | Só acontece com formulário adulterado; ignorar esconderia o problema          |
| Duração máxima por sala                | Inteiro de 15 a 720 min por sala, padrão 240                                     | 15 é a duração mínima de uma reserva; 12 h cobre o maior dia útil esperado    |
| Reduzir o limite de uma sala           | Vale só para novas reservas; as já feitas continuam válidas                      | A regra é checada na criação; invalidar reservas existentes não foi pedido    |
| Exibição da duração                    | `1 h`, `1 h 30 min`, `30 min` (sem zeros nem decimais)                           | Lê melhor que `1,5 h` ou `90 min` e serve para qualquer limite                |
| Aviso de sucesso no admin              | Action redireciona com `?created=1` ou `?updated=1` para `/admin/rooms`          | Mesmo padrão da criação de reserva                                            |

## Técnica

| Tema                 | Decisão                                                                                                                   | Motivo                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Backend              | Next.js full stack (Server Actions + camada de serviço), sem backend separado                                             | Sem consumidor externo; menos contrato duplicado e menos código para manter                     |
| API REST             | Só `GET /api/health`                                                                                                      | Não há cliente externo; serviços já isolados permitem expor REST depois                         |
| Health check         | `GET /api/health` público e sem cache; lê uma tabela real; 200 `{"status":"ok"}` ou 503 `{"status":"error"}` sem detalhes | `SELECT 1` passaria com um SQLite vazio; o detalhe do erro fica só no log do servidor           |
| Banco                | SQLite com migrations Prisma                                                                                              | Zero infraestrutura, roda no CI, sobe em 3 comandos                                             |
| Concorrência         | Checagem de conflito + INSERT na mesma transação                                                                          | SQLite serializa escritas; em Postgres usaria exclusion constraint                              |
| Identidade           | Seletor "entrar como" + cookie httpOnly; permissões checadas no servidor                                                  | O enunciado dispensa login real; trocar por login real altera só `getCurrentUser`               |
| Estado no cliente    | URL (`searchParams`) + estado de formulário                                                                               | Leituras são Server Components; não há cache de cliente a gerenciar                             |
| Merge de PRs         | Sempre merge commit (sem squash/rebase)                                                                                   | Em Git flow, `main` e `develop` precisam compartilhar os commits de release/hotfix              |
| Autorização do admin | `requireAdmin()` (404) no layout, em cada página e em cada action; o serviço repete a checagem e lança `FORBIDDEN`        | 404 não revela a área; a checagem no serviço é testável sem cookies e protege outros chamadores |
| Loading em `/admin`  | Sem `loading.tsx`                                                                                                         | Com loading acima da página, o `notFound()` sai com status 200                                  |

## Fora do escopo (com motivo)

- Login real, recuperação de senha — dispensado pelo enunciado.
- Feriados no conceito de dia útil — exige calendário externo; só segunda a sexta.
- Reserva recorrente, convites, notificações, integração com calendário.
- Paginação da listagem de salas — volume pequeno.
- Rate limiting, métricas, tracing — ficariam no gateway/infra em produção.

## Pendências de decisão

<!-- Anote aqui dúvidas que surgirem durante a implementação, decida e mova para as tabelas acima. -->
