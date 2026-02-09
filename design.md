# Plant.io - Design Document

## Visão Geral

Plant.io é um aplicativo móvel que conecta **produtores rurais**, **consumidores** e **motoristas** para comercialização e transporte de produtos agrícolas. O app oferece cotações de mercado em tempo real, sistema de pedidos por voz/texto e gestão de entregas.

---

## Paleta de Cores

| Token | Cor | Uso |
|-------|-----|-----|
| **primary** | `#2E7D32` (Verde Escuro) | Botões principais, destaques |
| **secondary** | `#81C784` (Verde Claro) | Elementos secundários, ícones |
| **background** | `#FFFFFF` / `#151718` | Fundo das telas |
| **surface** | `#F1F8E9` / `#1E2022` | Cards, superfícies elevadas |
| **foreground** | `#1B5E20` / `#E8F5E9` | Texto principal |
| **muted** | `#689F38` / `#A5D6A7` | Texto secundário |
| **success** | `#4CAF50` | Preço baixando (bom para comprador) |
| **error** | `#F44336` | Preço subindo (ruim para comprador) |
| **warning** | `#FF9800` | Alertas, avisos |

---

## Lista de Telas

### 1. Tela de Boas-Vindas (Welcome)
- **Conteúdo**: Logo Plant.io centralizado, texto "Bem vindo ao Plant.io"
- **Ação**: Botão grande "Iniciar" que leva à Tela 2

### 2. Tela de Opções de Acesso (AuthOptions)
- **Conteúdo**: Dois botões centralizados
- **Ações**:
  - "Já tenho Cadastro" → Tela 3 (Seleção de Perfil)
  - "Novo cadastro" → Tela 2.1 (Cadastro)

### 2.1. Tela de Cadastro (Registration)
- **Campos**:
  - Telefone (com máscara)
  - CPF (com máscara)
  - Chave Pix
- **Ação**: Botão grande "Obter localização GPS"
- **Diálogo de Confirmação**: Exibe endereço obtido via GPS
  - "Sim" → Tela 3
  - "Não" → Diálogo de inserção manual/áudio

### 3. Tela de Seleção de Perfil (ProfileSelection)
- **Conteúdo**: "Eu sou:" com 3 opções
- **Opções**:
  - Consumidor → Tela 4
  - Produtor Rural → Tela 4.1
  - Motorista → Tela 5

### 4. Tela do Consumidor (ConsumerHome)
- **Abas**: Principal | Mercado
- **Aba Principal**:
  - Quadro "Produtos Solicitados" (lista de pedidos)
  - Botão "Inserir pedido" (abre modal: áudio ou escrito)
- **Aba Mercado**:
  - Lista de cotações com indicadores de preço
  - Seta verde ↓ = preço baixando
  - Seta vermelha ↑ = preço subindo

### 4.1. Tela do Produtor Rural (ProducerHome)
- **Abas**: Principal | Mercado
- **Aba Principal**:
  - Quadro "Produtos disponíveis pra venda"
  - Botão "Ofertar produto" (abre modal: áudio ou escrito)
- **Aba Mercado**:
  - Lista de cotações com indicadores de preço
  - Seta verde ↓ = preço subindo (bom para produtor)
  - Seta vermelha ↑ = preço baixando (ruim para produtor)

### 5. Tela do Motorista (DriverHome)
- **Conteúdo**: Lista de viagens disponíveis
- **Cada viagem mostra**:
  - Origem → Destino (com seta verde)
  - Descrição da carga (ex: "3 caixas de tomate")
  - Valor do frete (ex: R$560)
  - Botão "Iniciar Transporte"

### 5.1. Tela de Transporte Ativo (ActiveTrip)
- **Conteúdo**:
  - Se valor > R$500: Botão "Solicitar Adiantamento de 50%"
  - Botão obrigatório: "Inserir Selfie do motorista"
  - Ao iniciar: Diálogo "Quando chegar ao produtor, clique em Inserir Foto do produto"
  - Botão "Inserir Foto do produto"

---

## Fluxos de Usuário

### Fluxo de Novo Cadastro
1. Welcome → Iniciar
2. AuthOptions → Novo cadastro
3. Registration → Preencher dados → Obter localização GPS
4. Diálogo de confirmação de endereço
5. Se "Não" → Inserir manual ou áudio → Repetir até "Sim"
6. ProfileSelection → Escolher perfil
7. Tela específica do perfil

### Fluxo de Usuário Existente
1. Welcome → Iniciar
2. AuthOptions → Já tenho Cadastro
3. ProfileSelection → Escolher perfil
4. Tela específica do perfil

### Fluxo do Consumidor
1. ConsumerHome (Aba Principal)
2. Ver pedidos existentes
3. Inserir pedido (áudio ou escrito)
4. Alternar para Aba Mercado para ver cotações

### Fluxo do Produtor
1. ProducerHome (Aba Principal)
2. Ver produtos ofertados
3. Ofertar produto (áudio ou escrito)
4. Alternar para Aba Mercado para ver cotações

### Fluxo do Motorista
1. DriverHome → Ver viagens disponíveis
2. Selecionar viagem → Iniciar Transporte
3. ActiveTrip:
   - Inserir selfie
   - Se valor > R$500: Solicitar adiantamento
   - Ao chegar no produtor: Inserir foto do produto

---

## Componentes Reutilizáveis

| Componente | Descrição |
|------------|-----------|
| **BigButton** | Botão grande com estilo primário |
| **InputField** | Campo de entrada com máscara opcional |
| **ProfileCard** | Card para seleção de perfil |
| **ProductItem** | Item de produto com preço e indicador |
| **TripCard** | Card de viagem para motorista |
| **ConfirmDialog** | Modal de confirmação com Sim/Não |
| **InputMethodModal** | Modal para escolher áudio ou texto |
| **MarketQuote** | Item de cotação com seta de tendência |

---

## Navegação

```
Welcome
  └── AuthOptions
        ├── Registration (Novo cadastro)
        │     └── ProfileSelection
        │           ├── ConsumerHome (Consumidor)
        │           ├── ProducerHome (Produtor Rural)
        │           └── DriverHome (Motorista)
        │                 └── ActiveTrip
        └── ProfileSelection (Já tenho Cadastro)
              ├── ConsumerHome
              ├── ProducerHome
              └── DriverHome
                    └── ActiveTrip
```

---

## Considerações de UX

1. **Orientação**: Portrait (9:16), uso com uma mão
2. **Botões grandes**: Facilitar toque com polegar
3. **Feedback háptico**: Em ações importantes
4. **Cores de tendência**: Verde = bom, Vermelho = ruim (contextual por perfil)
5. **Gravação de áudio**: Permissão de microfone necessária
6. **Geolocalização**: Permissão de localização necessária
7. **Câmera**: Permissão para selfie e foto de produtos
