let SUITS = {
  hearts: '❤',
  diamonds: '♦',
  cross: '♣',
  spades: '♠'
}

let Card = class{
  constructor(params = {}){
    this.value = params.value;
    this.suit = params.suit;
    this.isTrump = params.isTrump;
    
    let topValues = {11:'В', 12:'Д', 13:'К', 14:'Т'}
    let title = this.value < 11 ? String(this.value) : topValues[this.value]
    this.title = title + this.suit;
  }

  isSameValue(card){
    return (this.value==card.value)
  }

  isSameSuit(card){
    return (this.suit==card.suit)
  }
}

let CardsCollection = class{
  load(cards){
    this.cards = [];
    for(let i in cards){
      this.cards.push( new Card(cards[i]) );
    }
  }
}

let Table = class{
  constructor(card_pairs){
    this.load(card_pairs)
  }

  load(pairs){
    this.card_pairs = [];

    let attack;
    let defence;
    for(let i in pairs){
      attack = new Card(pairs[i].attack);
      defence = null;
      if(pairs[i].defence){
        defence = new Card(pairs[i].defence);
      }
      this.card_pairs.push( { attack:attack, defence:defence } );
    }
  }

  clear(){
    this.card_pairs = [];
  }

  isBlank(){
    return (this.card_pairs.length==0)
  }

  canAdd(card){
    if(this.isBlank()){ return true }
    let pair;
    for(let i in this.card_pairs){
      pair = this.card_pairs[i];

      if(pair.attack.isSameValue(card)){
        return true;
      }
      if(!pair.defence){ continue }

      if(pair.defence.isSameValue(card)){
        return true;
      }
    }
    return false;
  }

  add(card){
    if(!this.canAdd(card)){ return false }
    this.card_pairs.push({ attack: card });
    return true;
  }

  allCardsCovered(){
    if(this.isBlank()){ return false }
    for(let i in this.card_pairs){
      if(this.card_pairs[i].attack && !this.card_pairs[i].defence){
        return false;
      }
    }
    return true;
  }

  getPairForAttack(card){
    if(this.isBlank()){ return false }
    if(this.allCardsCovered()){ return false }

    let pair;
    let acard;
    for(let i in this.card_pairs){
      pair = this.card_pairs[i];
      if(pair.defence){ continue } // уже отбита

      acard = pair.attack;
      if(acard.isSameSuit(card)&&(acard.value<card.value)){
        return i;
      }
      // + козырные!
      if(!acard.isTrump&&card.isTrump){
        return i;
      }
    }
    return false;
  }

  defenceWith(card){
    let pair_index = this.getPairForAttack(card);
    if(!pair_index){ return false }
    this.card_pairs[pair_index].defence = card;
    return true;
  }

}

let Deck = class extends CardsCollection{
  constructor(params){
    super();
    if(params){
      this.load(params.cards);
      this.tramp = params.tramp;
      return
    }

    this.cards = this.shuffle(this.fullDeck());
    this.tramp = this.cards[0].suit;
  }

  fullDeck(){
    let cards = [];
    let cards_arr = [6,7,8,9,10,11,12,13,14];

    for(let i in cards_arr){
      let value = cards_arr[i];

      for(let s in SUITS){
        cards.push( new Card({ value: value, suit: SUITS[s] }) );
      }
    }
    return cards;
  }

  shuffle(array){
    var currentIndex = array.length, temporaryValue, randomIndex;
    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
  
    return array;
  }

  takeCard(){
    // берем первую карту с конца массива
    if(this.cards.length==0){ return }
    let card = this.cards[ this.cards.length  - 1 ];
    this.cards = this.cards.slice(0, -1);

    card.isTrump = (card.suit == this.tramp);
    return card;
  }
}

let Player = class extends CardsCollection{
  constructor(params){
    super();
    this.cards = [];
    this.deck = params.deck;
    this.table = params.table;
    this.first_name = params.first_name;
    this.player_key = params.player_key;

    if(params.cards){
      this.load(params.cards);
      this.isDefendNow = params.isDefendNow;
    }else{
      this.takeCardsFromDeck();
    }

    this.sortCards()
  }

  actionHint(){
    return this.isDefendNow ? 'Вы отбиваетесь' : 'Вы подкидываете';
  }

  sortCards(){
    this.cards = this.cards.sort(this.doSortCard);
  }

  doSortCard(a,b){
    let v1 = a.isTrump ? 100 + a.value : a.value;
    let v2 = b.isTrump ? 100 + b.value : b.value;

    if(v1<v2){ return -1 }
    if(v1==v2){ return 0 }
    return 1;
  }

  takeCardsFromDeck(){
    // берём не больше 6-ти карт
    let card;
    for(let i=0; i<6; i++){
      if(this.cards.length>5){ break }
      card = this.deck.takeCard();
      if(!card){ return }
      this.cards.push(card);
      this.sortCards();
    }
  }

  takeCardsFromTable(){
    let pairs = this.table.card_pairs;
    if(!this.isDefendNow){ return false }
    if(pairs.length==0){ return false }
    if(this.table.allCardsCovered()){ return false }

    for(let i=0; i<pairs.length; i++){
      this.cards.push(pairs[i].attack);
      if(pairs[i].defence){
        this.cards.push(pairs[i].defence);
      }
    }

    this.table.clear();
    this.sortCards();
    return true;
  }

  defenceWith(card){
    return this.table.defenceWith(card);
  }

  attackBy(card){
    return this.table.add(card);
  }

  removeCard(cardIndex){
    this.cards.splice(cardIndex, 1);
  }

  throwCard(cardIndex){
    let card = this.cards[cardIndex];

    let result = this.isDefendNow ? this.defenceWith(card) : this.attackBy(card)

    if(result){
      this.removeCard(cardIndex);
      return true;
    }
    return false;
  }

}

let Game = class{
  constructor(params={}){
    this.onRefresh = params.onRefresh;
    this.onGameOver = params.onGameOver;
    this.runCommandOnGameOver = params.runCommandOnGameOver;

    this.isNewGame = params.isNewGame;
    this.curGameWithPlayer = params.curGameWithPlayer;

    this.deck = new Deck(params.deck_cards);
    this.table = new Table(params.table_cards);

    let prms = { deck: this.deck, table: this.table }
    
    if(!params.withoutFirstPlayer){
      prms.first_name = 'Игрок 1';
      prms.player_key = 'player1';

      if(params.player1){
        prms.cards = params.player1.cards;
        prms.isDefendNow = params.player1.isDefendNow
      }

      this.player1 = new Player(prms);
      if(!params.player1){
        this.player1.isDefendNow = true;
      }
    }

    prms.first_name = 'Игрок 2';
    prms.player_key = 'player2';

    if(params.player2){
      prms.cards = params.player2.cards;
      prms.isDefendNow = params.player2.isDefendNow;
    }
    this.player2 = new Player(prms);

    if(params.withoutFirstPlayer){ return }

    if(params.player2){
      this.refresh();
    }
  }

  toJson(){
    let result = {
      deck_cards: { cards: this.deck.cards, tramp: this.deck.tramp },
      table_cards: this.table.card_pairs,
      player1: { cards: this.player1.cards, isDefendNow:this.player1.isDefendNow, player_key: 'player1' },
      player2: { cards: this.player2.cards, isDefendNow:this.player2.isDefendNow, player_key: 'player2' },
      runCommandOnGameOver: this.runCommandOnGameOver
    }
    return result;
  }

  throwCardBy(player, cardIndex){
    if(player.throwCard(cardIndex)){
      this.refresh();
    }
  }

  cardsButtons(player, method){
    let result = '';

/*    for(let i in player.cards){
      result+= '<a href='#' '+ 
                  'onclick='' + 
                    'game.throwCardBy(' + method + ', ' + i + ')'+ 
                  ''>' +
                player.cards[i].title + '</a> ';
    }
*/
    return result;
  }

  tableCards(){
    let result = '';
    let pairs = this.table.card_pairs;
    let defence;
    for(let i in pairs){
      defence = '';
      if(pairs[i].defence){
        defence = ' < ' + pairs[i].defence.title;
      }
      result+= '\n' + pairs[i].attack.title + defence;
    }
    
    if(result==''){ result = 'Бросьте карту' }

    return result;
  }

  playersGetCardsFromDeck(){
    if(this.player2.isDefendNow){
      this.player1.takeCardsFromDeck();
      this.player2.takeCardsFromDeck();
    }else{
      this.player2.takeCardsFromDeck();
      this.player1.takeCardsFromDeck();
    }
  }

  checkVictory(){
    let winner;
    if(this.deck.cards.length>0){ return false }

    if(this.player1.cards.length==0){ winner = this.player1 }
    if(this.player2.cards.length==0){ winner = this.player2 }

    if(winner&&this.onGameOver){
      this.onGameOver(this, winner);
    }
  }

  takeCards(player){
    if(!player.takeCardsFromTable()){ return }
    this.playersGetCardsFromDeck();
    this.refresh();
    return true;
  }
  
  changePlayer(){
    this.player1.isDefendNow=!this.player1.isDefendNow;
    this.player2.isDefendNow=!this.player2.isDefendNow;
    this.isPlayersChanged = true;
  }

  acceptBy(player){
    if(player.isDefendNow){ return false }
    if(!this.table.allCardsCovered()){ return false }

    this.table.clear();
    this.playersGetCardsFromDeck();
    this.changePlayer();
    this.refresh();
    return true;
  }

  refresh(){
    this.onRefresh(this);
    this.checkVictory();
  }

}

let PlayerBot = class extends Player{
  constructor(params){
    super(params);
    this.isBot = true;
  }

  defence(){
    if(!this.isDefendNow){ return false}

    if(this.table.allCardsCovered()){ return true }

    for(let i in this.cards){
      // козырей не выкладываем в начале!
      if( this.cards[i].isTrump&&
        (this.cards.length<11)&&
        (this.deck.cards.length > 8)){
       break;
      }

      this.throwCard(i);
    }
    if(!this.table.allCardsCovered()){
      // нужно событие - бот взял
      return false;
    }
    return true;
  }

  attack(){
    if(this.isDefendNow){ return }

    let result = false;
    for(let i in this.cards){
      // если на столе есть карты, и в колоде тоже
      // козырей не выкладываем
      if( this.cards[i].isTrump&&
         (this.table.card_pairs.length>0)&&
         (this.deck.cards.length > 5)){
        break;
      }
      if(this.throwCard(i)){ result = true }
    }
    return result;
  }

}

let GameWithBot = class extends Game{
  constructor(params={}){
    params.withoutFirstPlayer = true;
    super(params);

    let prms = { deck: this.deck, table: this.table }

    prms.first_name = 'Бот';
    if(params.player1){
      prms.cards = params.player1.cards;
      prms.isDefendNow = params.player1.isDefendNow;
    }
    this.player1 = new PlayerBot(prms);

    if(!this.player2.isDefendNow){
      this.player1.isDefendNow = true;
    }

    if(params.player1){
      this.refresh();
    }
  }

  
  throwCardBy(player, cardIndex){
    if(player.throwCard(cardIndex)){
      this.refresh();
    }

    if(player.isBot){ return }
    
    if(this.player1.isDefendNow){
      // бот отбивается
      if(!this.player1.defence()){
        // бот не отбился
        return this.takeCards(this.player1);
      }
    }else{
      // бот атакует
      if(!this.player1.attack()){
        // бот не может больше подкинуть
        return this.acceptBy(this.player1);
      }
    }

    this.refresh();
  }

  acceptBy(player){
    let result = super.acceptBy(player);
    if(!result){ return false }

    if(this.player1.isDefendNow){ return }
    // атакуем ботом

    this.player1.attack();
    this.refresh();
  }

  takeCards(player){
    let result = super.takeCards(player);
    if(!result){ return }

    if(!player.isBot){
      this.player1.attack();
      this.refresh();
    }
  }

}

let libPrefix = 'DurakGameLib_'

let CustomGame = class{  
  newGame(options = {}){

    options.onRefresh = this.onRefreshGame;
    options.isNewGame = true;

    User.setProperty('keyboard', '', 'string' );

    return this.setupGame(options)
  }

  setupGame(options){}

  loadGameData(){
    return User.getProperty('gameData');
  }

  saveGameData(game){
    let data = game.toJson();
    User.setProperty('gameData', data, 'json');
  }

  continueGame(){
    let options = this.loadGameData();
    if(!options||(options=={})){ return }

    options.onRefresh = this.onRefreshGame;
    options.onGameOver = this.onGameOverEvent;
    return this.setupGame(options);
  }

  getGameInfo(game, otherPlayer){
    let content = 'В колоде: ' + game.deck.cards.length + ' карт(ы)';
    content+='\nКозырь: ' + game.deck.tramp;
    content+= '\nУ противника:\n'

    for(let i in otherPlayer.cards){ content+='🃏' }
    return content;
  }

  sendMessagesOnNewGame(game, curPlayer, otherPlayer){
    let content = this.getGameInfo(game, otherPlayer);
    let tableCards = game.tableCards();
    let buttons = this.getButtons(game, curPlayer);

    Bot.sendMessage({ text: content, result_to_bot_property: 'GameInfoMsg' + chat.chatid })
    Bot.sendMessage( { text: tableCards, result_to_bot_property: 'TableMsg' + chat.chatid } );
    Bot.sendMessage({ text: 'Вы подкидываете', result_to_bot_property: 'ActionMsg' + chat.chatid });

    /// Bot.sendInlineKeyboard(buttons, 'Ваши карты'); старый метод

    Bot.sendMessage({ text: 'Ваши карты', 
      inline_keyboard: buttons,
      result_to_bot_property: curPlayer.player_key + 'CardsMsg' + chat.chatid 
    } );
  }

  getCardBtnCommand(btnIndex){
    return libPrefix + 'throw-card ' + String(btnIndex);
  }

  getButtons(game, player){
    let buttons = [];
    let row = [];
    let card;
    for(let i in player.cards){
      card = player.cards[i];
      if(row.length > 3){
        buttons.push(row);
        row = [];
      }
      row.push(
        { title: card.title, command: this.getCardBtnCommand(i) }
      )
    }

    buttons.push(row);
    if(!game.table.isBlank()){
      buttons.push(this.getActionButton(player));
    }
    return buttons;
  }

  getActionButton(player){
    if(player.isDefendNow){
      return [ { title: 'Взять', command: libPrefix + 'take-cards' } ]
    }
    return [ { title: 'Бита!', command: libPrefix + 'accept' } ]
  }

  doRefreshGame(game, curPlayer, otherPlayer){
    if(game.isNewGame){
      this.sendMessagesOnNewGame(game, curPlayer, otherPlayer);
    }else{
      this.editMessages(game, curPlayer, otherPlayer)
    }

    this.saveGameData(game);
  }

  clearActionsWithName(name){
    for(let ind in js_result.actions){
      if( js_result.actions[ind].name==name ){
        js_result.actions.splice(ind, 1);
      }
    }
  }

  editMessages(game, curPlayer, otherPlayer){
    this.clearActionsWithName('edit-message');

    let content = this.getGameInfo(game, otherPlayer);
    let tableCards = game.tableCards();
    let buttons = this.getButtons(game, curPlayer);

    let msgId = request.message.message_id;
    msgId = msgId - 3;
    Bot.editMessage(content, msgId);
    Bot.editMessage(tableCards, msgId+1);

    if(game.isPlayersChanged){
      let actionMsg = curPlayer.isDefendNow ? 'Вы отбиваетесь' : 'Вы подкидываете'
      Bot.editMessage(actionMsg, msgId+2);
    }

    let existKeyboard = User.getProperty('keyboard');
    let curKeyboard = JSON.stringify(buttons);
    
    if(existKeyboard!=curKeyboard){        
      Bot.editInlineKeyboard(buttons, msgId+3);
      User.setProperty('keyboard', curKeyboard, 'string');
    }
  }

}

let BotGame = class extends CustomGame{
  setupGame(options){
    let game;
    game = new GameWithBot(options)

    game.refresh();
    return game;
  }

  onRefreshGame(game){
    let g = new BotGame();
    /// player2 - человек, player1 - бот
    g.doRefreshGame(game, game.player2, game.player1)
  }

  onGameOverEvent(game, player){
    User.setProperty('curGame', {}, 'json')

    if(game.player2==player){
      Bot.sendMessage('Вы выиграли!');
    }else{
      Bot.sendMessage('Вы проиграли!');
    }
    
  }

}


let PlayersGame = class extends CustomGame{
  getInviteLink(user){
    Bot.setProperty('waitForGame' + String(chat.chatid), true, 'boolean');
    Bot.setProperty('Game' + chat.chatid, false, 'boolean');
    return 'https://t.me/' + bot.name + '?start=' + String(chat.chatid);
  }

  setupGame(options){
    let game;
    game = new Game(options)

    game.refresh();
    return game;
  }

  getPropForSave(){
    let curGame = Bot.getProperty('Game' + chat.chatid);
    if(!curGame){ return }
    return curGame.savedAs;
  }

  loadGameData(){
    let propName = this.getPropForSave();
    if(!propName){ return }
    return Bot.getProperty(propName);
  }

  saveGameData(game){
    let propName
    if(game.isNewGame){
      propName = '2PlayersGameData' + game.curGameWithPlayer;
    }else{
      propName = this.getPropForSave();
      if(!propName){ return }
    }

    let data = game.toJson();
    Bot.setProperty(propName, data, 'json');
  }

  newGameByLink(options){
    let chatId = options.chat_id
    let wait =  Bot.getProperty('waitForGame' + chatId)
    if(!wait){
      Bot.sendMessage('Кажется ссылка сгорела');
      return
    }

    /// уже не принимаем другие игры 
    Bot.setProperty('waitForGame' + chatId, false, 'boolean');

    /// запоминаем в две переменные данные игры
    let savedAs = '2PlayersGameData' + chatId;


    let gameParams = { savedAs:savedAs, curPlayer: 'player1', chatId: chat.chatid }
    Bot.setProperty('Game' + chatId,  gameParams, 'json' );

    gameParams = { savedAs:savedAs, curPlayer: 'player2', chatId: chatId }
    Bot.setProperty('Game' + chat.chatid, gameParams, 'json' );

    return this.newGame({ curGameWithPlayer: chatId,
      runCommandOnGameOver: options.runCommandOnGameOver });
  }

  getCardBtnCommand(btnIndex){
    return libPrefix + '2players-throw-card ' + String(btnIndex);
  }

  getActionButton(player){
    if(player.isDefendNow){
      return [ { title: 'Взять', command: libPrefix + '2players-take-cards' } ]
    }
    return [ { title: 'Бита!', command: libPrefix + '2players-accept' } ]
  }

  onRefreshGame(game){
    let g = new PlayersGame();

    let options = Bot.getProperty('Game' + chat.chatid);

    let curPlayer, otherPlayer;

    if(options){
      curPlayer = ( options.curPlayer=='player1' ? game.player1 : game.player2 );
      otherPlayer = ( options.curPlayer=='player1' ? game.player2 : game.player1 );
    }else{
      // это новая игра по ссылке
      curPlayer = game.player2;
      otherPlayer = game.player1;
    }

    g.doRefreshGame(game, curPlayer, otherPlayer)
  }

  doRefreshGame(game, curPlayer, otherPlayer){
    super.doRefreshGame(game, curPlayer, otherPlayer);

    if(game.isNewGame){
      this.sendMessagesToOtherOnNewGame(game, otherPlayer); 
    }else{
      this.editMesagesToOther(game, curPlayer, otherPlayer);
    }


  }

  sendMessagesToOtherOnNewGame(game, otherPlayer){
    let chatid = game.curGameWithPlayer;

    let content = this.getGameInfo(game, otherPlayer);
    let buttons = this.getButtons(game, otherPlayer);

    Bot.sendMessage({ text: content, chat_id:chatid, result_to_bot_property: 'GameInfoMsg' + chatid })
    Bot.sendMessage( { text: 'на столе пусто', chat_id:chatid, result_to_bot_property: 'TableMsg' + chatid } );

    Bot.sendMessage({ text: 'Вы отбиваетесь', chat_id:chatid, result_to_bot_property: 'ActionMsg' + chatid });

    Bot.sendMessage({ text: 'Ваши карты', 
        chat_id: chatid, inline_keyboard: buttons,
        result_to_bot_property: otherPlayer.player_key + 'CardsMsg' + chatid } );

    // Bot.sendInlineKeyboardToChatWithId(chatid, buttons, 'Ваши карты');
  }

  getPrevMessage(propName){
    let prop = Bot.getProperty(propName);
    if(!prop){
      Bot.sendMessage('Свойство ' + propName + ' не найдено');
    }
    return prop;
  }

  editMessageToOtherFor(text, propName, otherChatId){
    let prevMessage = this.getPrevMessage(propName + otherChatId);
    if(!prevMessage){ Bot.sendMessage('!'); return }

    /// если тот же текст - не меняем
    if(prevMessage.result.text==text.split('\n').join('')){ return }

    Bot.editMessageInChat(otherChatId, text, prevMessage.result.message_id);    
    prevMessage.result.text = text;

    Bot.setProperty(propName + otherChatId, prevMessage, 'json');
  }

  editMesagesToOther(game, curPlayer, otherPlayer){
    this.clearActionsWithName('edit-message-in-other-chat');

    let gameData = Bot.getProperty('Game' + chat.chatid);
    let otherChatId = gameData.chatId;

    let content = this.getGameInfo(game, curPlayer);
    let buttons = this.getButtons(game, otherPlayer);

    this.editMessageToOtherFor(content, 'GameInfoMsg' , otherChatId);
    
    this.editMessageToOtherFor(game.tableCards(), 'TableMsg', otherChatId);

    if(game.isPlayersChanged){
      let actionMsg = otherPlayer.isDefendNow ? 'Вы отбиваетесь' : 'Вы подкидываете'
      this.editMessageToOtherFor(actionMsg, 'ActionMsg', otherChatId);
    }

    let propName = otherPlayer.player_key + 'CardsMsg';
    let myCardsMsg = this.getPrevMessage(propName + otherChatId);
    if(myCardsMsg){
      Bot.editInlineKeyboard(buttons, myCardsMsg.result.message_id, otherChatId);
    }
  }

  onGameOverEvent(game, winner){
    let propName = (new PlayersGame()).getPropForSave();
    if(!propName){ return }
    Bot.setProperty(propName, {}, 'json');

    if(game.runCommandOnGameOver){
      let options = Bot.getProperty('Game' + chat.chatid);
      
      options.isWinner = ( winner.player_key == options.curPlayer ? true : false )

      Bot.runCommand(game.runCommandOnGameOver + ' ' + JSON.stringify(options));
    }
  }

}


function newGameWithBot(){
  let game = new BotGame();
  game.newGame()
}

function continueGame(){
  let botGame = new BotGame();
  if(!botGame){ return }
  return botGame.continueGame();
}

function onThrowCard(){
  let game = continueGame();
  
  cardIndex = parseInt(params)
  game.throwCardBy(game.player2, cardIndex);
}

function onTakeCards(){
  let game = continueGame();
  game.takeCards(game.player2);
}

function onAccept(){
  let game = continueGame();
  game.acceptBy(game.player2);
}


function continuePlayersGame(){
  let playersGame = new PlayersGame();
  if(!playersGame){
    Bot.sendMessage('Кажется игра уже закончилась');
    return
  }

  return playersGame.continueGame();
}

function getPlayerForMultiplayerGame(game){
  /// { chatId: chat.id, curPlayer: 'player1' }
  let options = Bot.getProperty('Game' + chat.chatid);
  let player = ( options.curPlayer=='player1' ? game.player1 : game.player2 );
  return player;
}

function onThrowCardToOtherPlayer(){
  let game = continuePlayersGame();
  if(!game){ return }

  cardIndex = parseInt(params);
  let player = getPlayerForMultiplayerGame(game);

  game.throwCardBy(player, cardIndex);
}

function on2PlayersTakeCards(){
  let game = continuePlayersGame();
  if(!game){ return }

  let player = getPlayerForMultiplayerGame(game);
  game.takeCards(player);
}

function on2PlayersAccept(){
  let game = continuePlayersGame();
  if(!game){ return }

  let player = getPlayerForMultiplayerGame(game);
  game.acceptBy(player);
}

function getInviteLink(){
  return (new PlayersGame).getInviteLink(user);
}

function newGameWithPlayer(options){
  let game = new PlayersGame();
  game.newGameByLink(options);
}

function debug(){
  Bot.sendMessage('ChatId: ' + chat.chatid );

  gameData = Bot.getProperty('Game' + chat.chatid);
  Bot.sendMessage(inspect(gameData));

  game = Bot.getProperty(gameData.savedAs);
  Bot.sendMessage(inspect(game));
}


publish({
  newGameWithBot: newGameWithBot,
  getInviteLink: getInviteLink,
  newGameWithPlayer: newGameWithPlayer
})


on(libPrefix + 'throw-card', onThrowCard );
on(libPrefix + 'take-cards', onTakeCards );
on(libPrefix + 'accept', onAccept );

on(libPrefix + '2players-throw-card', onThrowCardToOtherPlayer);

on(libPrefix + '2players-take-cards', on2PlayersTakeCards);
on(libPrefix + '2players-accept', on2PlayersAccept);

on('/debug', debug);

