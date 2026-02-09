# Plant.io - TODO

## Configuração Inicial
- [x] Gerar logo do aplicativo
- [x] Configurar cores do tema (verde agrícola)
- [x] Atualizar app.config.ts com branding

## Telas de Onboarding
- [x] Tela 1: Welcome (Bem vindo ao Plant.io + Botão Iniciar)
- [x] Tela 2: AuthOptions (Já tenho Cadastro / Novo cadastro)

## Cadastro
- [x] Tela 2.1: Registration (Telefone, CPF, Pix)
- [x] Botão Obter localização GPS
- [x] Diálogo de confirmação de endereço
- [x] Opção inserir endereço manualmente
- [x] Opção inserir endereço via áudio

## Seleção de Perfil
- [x] Tela 3: ProfileSelection (Consumidor, Produtor Rural, Motorista)

## Tela do Consumidor
- [x] Tela 4: ConsumerHome - Aba Principal
- [x] Quadro Produtos Solicitados
- [x] Botão Inserir pedido (escrito)
- [x] Aba Mercado com cotações
- [x] Indicadores de preço (seta verde baixando, vermelha subindo)
- [x] Aba Histórico de transações

## Tela do Produtor Rural
- [x] Tela 4.1: ProducerHome - Aba Principal
- [x] Quadro Produtos disponíveis pra venda
- [x] Botão Ofertar produto (escrito)
- [x] Aba Mercado com cotações (lógica invertida)
- [x] Aba Histórico de transações

## Tela do Motorista
- [x] Tela 5: DriverHome - Lista de viagens disponíveis
- [x] Cards de viagem (origem, destino, carga, valor)
- [x] Botão Iniciar Transporte
- [x] Aba Histórico de entregas

## Transporte Ativo
- [x] Tela 5.1: ActiveTrip
- [x] Botão Solicitar Adiantamento (se valor > R$500)
- [x] Botão Inserir Selfie do motorista
- [x] Diálogo ao iniciar corrida
- [x] Botão Inserir Foto do produto

## Navegação
- [x] Configurar rotas entre telas
- [x] Persistir dados do usuário (AsyncStorage)

## Atualizações v2.0

### Logo e Cores
- [x] Atualizar logo com imagem fornecida pelo usuário
- [x] Aplicar cores temáticas (verde claro #8BC34A, azul escuro #1B3A4B)

### Separação de Perfis
- [x] Restringir acesso do Consumidor apenas a suas informações
- [x] Restringir acesso do Produtor apenas a suas informações
- [x] Restringir acesso do Motorista apenas a suas informações
- [x] Remover tab bar - cada perfil vê apenas sua tela

### Painel Administrativo
- [x] Criar tela de login do administrador
- [x] Criar painel para gerenciar cotações de mercado
- [x] Criar painel para gerenciar viagens disponíveis
- [x] Permitir correção de erros pelo admin

### Notificações Push
- [x] Configurar expo-notifications
- [x] Notificar motoristas sobre novas viagens
- [x] Notificar consumidores sobre status de pedidos
- [x] Notificar produtores sobre vendas

## Atualizações v3.0

### Login e Autenticação
- [x] Login por CPF na tela "Já tenho cadastro"
- [x] Tela inicial com "Bem vindo, (Nome do usuário)"
- [x] Persistência de sessão - ir direto para último acesso
- [x] Opção de ver senha ao digitar

### Produtos e Imagens
- [x] Inserir fotos genéricas de cada produto (domínio público)
- [x] Ordenar produtos em ordem alfabética
- [x] Correção ortográfica automática de produtos
- [x] Opção de inserir preço para produtos fora da tabela
- [x] Remover exemplos de produtos da versão atual

### Cálculos e Valores
- [x] Mostrar valor total para produtor (receber) e consumidor (pagar)
- [x] Valor motorista: R$1,5 por km do destino
- [x] Consumidor: preço = distância x R$1,5 + 30% sobre valor tabela
- [x] Produtor: preço = (valor tabela - 30%) - (distância até Fortaleza x R$1,5)

### GPS e Localização
- [x] GPS em tempo real do motorista
- [x] Calcular distância entre produtor e consumidor
- [x] Calcular distância do produtor até Fortaleza

### Notificações
- [x] Notificação sonora curta
- [x] Notificar motorista de novas viagens (app fechado)
- [x] Notificar vendedor quando encontrar comprador (app fechado)
- [x] Notificar admin quando solicitado 50% de adiantamento

### Motorista
- [x] Ordenar viagens por valor (mais cara primeiro)
- [x] Acesso à câmera para fotos
- [x] Foto visível apenas uma vez pelo motorista
- [x] Admin vê todas as fotos

### Painel Admin Avançado
- [x] Ver transações por usuário
- [x] Ver vendas por data
- [x] Localização de produtores em tempo real
- [x] Localização de consumidores em tempo real
- [x] Localização de motoristas em tempo real

### Histórico de Transações
- [x] Consumidores verem transações passadas
- [x] Vendedores verem transações passadas
- [x] Mostrar valores e datas

### Melhorias de UX
- [x] Corrigir acentuações (ç e acentos)
- [x] Centralizar botões na tela
- [x] Aumentar tamanho das fontes
- [x] Transições suaves entre telas
- [x] Usar logomarca como ícone do app

## Atualizações v4.0

### Admin - Edição e Gestão
- [x] Permitir admin editar fotos dos produtos
- [x] Permitir admin excluir cadastros de usuários
- [x] Remover aba "Viagens" do admin (desnecessária)
- [x] Busca por texto e data em Usuários, Transações, Adiantamento e Fotos
- [x] Cores diferentes por categoria: Consumidor (azul), Produtor (verde), Motorista (laranja)
- [x] Aba de confirmação de pagamentos

### Ocultar Informações de Cálculo
- [x] Ocultar preço base, distância e cálculos para consumidor
- [x] Ocultar preço base, distância e cálculos para produtor
- [x] Ocultar preço base, distância e cálculos para motorista
- [x] Mostrar apenas valores em R$ (Pago ou Recebido)
- [x] Informações de cálculo visíveis apenas para admin

### Fluxo do Motorista
- [x] Após iniciar viagem: botão "Cheguei no destino de busca"
- [x] Após chegar: botão "Tirar foto do produto"
- [x] Após foto: botão "Cheguei no destino de entrega"
- [x] Mostrar viagens apenas após confirmação de pagamento (consumidor + admin)

### Permuta de Categorias
- [x] Permitir usuário trocar entre Consumidor, Produtor e Motorista

### Login e Cadastro
- [x] Checkbox "Lembrar de mim" na tela de login por CPF
- [x] Ir direto para tela inicial se "Lembrar de mim" ativo
- [x] Scroll automático ao inserir dados no cadastro (evitar teclado cobrir)
- [x] Botão ofertar/solicitar mais centralizado (não cobrir teclado)

### Produtos e Mercado
- [x] Opção de definir unidade: Kg ou Unidade
- [x] Abrir "Preço por unidade" apenas se produto não estiver na lista
- [x] Correção ortográfica antes de abrir preço personalizado
- [x] Produtor: "Você Recebe" mínimo R$10,00
- [x] Ajustar cotação quando produtor mais próximo do consumidor que de Fortaleza
- [x] Localização padrão Fortaleza: -3.845222, -38.586443

### Gateway de Pagamento PIX
- [x] Chave PIX telefone: (85) 98201-9013
- [x] Botão "Copiar chave PIX"
- [x] Mensagem "Aguarde confirmação de pagamento"
- [x] Notificar admin quando solicitado confirmação de pagamento

### Fluxo de Pagamento
- [x] Motorista vê viagem apenas após pagamento confirmado (consumidor + admin)
- [x] Produtor recebe pagamento apenas após motorista confirmar retirada
- [x] Motorista recebe pagamento apenas após confirmar destino final + admin

### Notificações Corrigidas
- [x] Remover notificações falsas de vendas não realizadas
- [x] Remover notificações falsas de viagens
- [x] Notificar produtor/consumidor quando motorista aceitar corrida
- [x] Notificar admin quando solicitado confirmação de pagamento

### Edição de Pedidos
- [x] Permitir editar pedido/venda antes de ser aceita por motorista

### Áudio
- [x] Desativar todas opções de ofertas/demandas por áudio

## Atualizações v5.0

### Admin - Busca Inteligente
- [x] Filtrar usuários por uso e operações feitas
- [x] Busca com sugestão automática (ao digitar "Rodr" sugerir "Rodrigo")
- [x] Melhorar confirmação de pagamento do admin

### Navegação
- [x] Corrigir botão voltar na tela inicial (não voltar para versão passada)

### Ofertas e Demandas Visíveis
- [ ] Consumidor ver ofertas de produtores na aba principal
- [ ] Mostrar apenas cidade (não nome), Ex.: "Produtor Banana 30Kg"
- [ ] Ao clicar em oferta, ir para finalização de compra
- [ ] Produtor ver demandas de consumidores na aba principal
- [ ] Ao clicar em demanda, ir para "Ofertar produto"
- [ ] Notificar consumidor quando produtor responder demanda

### Nova Política de Preços
- [x] Taxa de 30% (dividir por 0,7)
- [x] Manter frete R$1,5/km
- [x] Se produto > R$100/Kg, mostrar preço para 20 unidades
- [x] Consumidor: mostrar apenas valor final a pagar
- [x] Produtor: mostrar apenas valor que vai receber (sem mencionar taxas)
- [x] Se produtor receber <= R$10, mostrar preço para 30Kg
- [x] Recalcular frete quando houver oferta mais próxima que Fortaleza
- [x] Optar pelo mais barato para o consumidor

### Integração Google Maps
- [x] Motorista acessar Maps ao aceitar corrida
- [x] Mostrar endereço do produtor e consumidor no Maps

### Restrições
- [x] Retirar opção de consumidor sugerir preço de produtos fora da lista
- [x] Preço personalizado exclusivo para produtor e admin

### UX e Interface
- [x] Aumentar fonte em 3 números em todas as telas
- [x] Botão "Ofertar/Solicitar produto" flutuante no meio da tela
- [x] Scroll apenas na parte "Chave Pix" no novo cadastro

## Atualizações v6.0

### Sistema de 3 Tabelas
- [ ] Tabela Admin (referência padrão)
- [ ] Tabela Consumidor: Produto/0,8
- [ ] Tabela Produtor: Produto*0,7
- [ ] Novo frete motorista: 1*(Distância Produtor-Consumidor)
- [ ] Valor pago consumidor: (Quantidade*Produto) + Frete
- [ ] Tabela consumidor: Preço/10Kg ou unidade
- [ ] Mostrar "Você paga: Valor/Kg, na compra de 10Kg"
- [ ] Ocultar todas as taxas para clientes

### Restrições de Cadastro
- [ ] 1 cadastro por CPF (não permitir permuta entre categorias)
- [ ] Validar CPF único no registro

### Navegação
- [ ] Comando voltar na tela inicial fecha o app

### Fluxo de Pagamento e Demandas
- [ ] Só mostrar demanda ao produtor quando consumidor confirmar pagamento via PIX
- [ ] Confirmação de pagamento ao admin: "Consumidor X realizou pagamento? (Sim/Não)"
- [ ] Só mostrar corrida ao motorista quando: pagamento confirmado + produtor aceitar demanda
- [ ] Caixa de diálogo ao produtor: "Consegue abastecer os produtos desta demanda?"

### Admin
- [ ] Permitir editar ofertas, demandas e viagens
- [ ] Permitir excluir ofertas, demandas e viagens

### Correções de UI
- [ ] Centralizar botão Solicitar/Ofertar produto
- [ ] Corrigir finalizar compra na aba principal
- [ ] Corrigir histórico de transações


## Atualizações v7.0

### Fontes
- [ ] Diminuir fontes em 2 números em todas as abas

### Login por CPF
- [ ] "Já tenho cadastro" abre direto a aba da categoria do CPF
- [ ] Não mostrar tela "Eu sou" para usuários já cadastrados
- [ ] Usar API para verificação de CPF existente

### Fluxo de Demandas
- [ ] Demanda aceita por produtor = consumidor notificado
- [ ] Consumidor aceita = Gateway de pagamento

### Fluxo de Ofertas
- [ ] Todas ofertas de produtores visíveis para consumidores
- [ ] Consumidor aceita oferta = Gateway com (Produto*Quantidade + Frete = Total)
- [ ] Após pagamento: Chave PIX → Admin confirma → Motorista vê viagem
- [ ] Motorista pega mercadoria → Produtor recebe
- [ ] Motorista entrega → Motorista recebe pagamento
- [ ] Dar opção do produtor excluir oferta

### Correções
- [ ] Corrigir acentuação em "O endereço está correto?"


## Atualizações v8.0

### Persistência de Dados
- [ ] Integrar banco de dados para ofertas/demandas
- [ ] Salvar ofertas de produtores no servidor
- [ ] Salvar demandas de consumidores no servidor
- [ ] Salvar viagens de motoristas no servidor
- [ ] Dados não são apagados ao fechar o app

### Histórico
- [ ] Permitir editar ofertas/demandas no histórico
- [ ] Permitir excluir ofertas/demandas no histórico
- [ ] Corrigir ortografia "Unidade" para "Unidades"

### Restrições
- [ ] Aba "Eu sou" restrita apenas para novos usuários
- [ ] Retirar opção de inserir endereço via áudio
- [ ] Retirar opção de motorista trocar de categoria
- [ ] Quantidade mínima 10Kg/Unidades para ofertas/demandas

### Admin
- [ ] Mudar senha do admin para "plantio1234568"

### UX e Interface
- [ ] Retirar termo "Origem:Cidade" na aba principal do consumidor
- [ ] Destacar "Valores que você recebe por 10 unidades" com fonte maior e cor forte
- [ ] Destacar "Você Recebe: R$Valor/10Kg" com fonte maior e cor forte
