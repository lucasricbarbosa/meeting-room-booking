# Changelog

Todas as mudanças relevantes deste projeto são registradas neste arquivo.

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto adota o [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Added

- Duração máxima de reserva por sala, de 15 min a 12 h, editável no admin e exibida no card e na tela de reserva (SALA-6).

## [1.0.0] - 2026-10-05

### Added

- Listagem de salas com filtros de capacidade e recursos guardados na URL (SALA-1).
- Reserva de sala com ocupação do dia e validação no servidor: início no passado, duração de 15 min a 4 h e conflito de horário (SALA-2).
- Minhas reservas com as próximas e as anteriores, e cancelamento pelo dono antes do início (SALA-3).
- Administração de salas: criar, editar e desativar, com nome único (SALA-4).
- Sessão "entrar como" com cookie httpOnly, cabeçalho com navegação e menu do usuário.
- Health check em `GET /api/health`.
- Schema, migration inicial, seed idempotente e `npm run setup`.
- CI em pull requests com lint, formatação, tipos, testes e build.
- README e registro de decisões do projeto.
