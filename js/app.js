const cards = document.getElementsByClassName('card'); // live collection of all cards
const matchedCards = document.getElementsByClassName('card match'); // live collection of all matched cards  
const openCards = document.getElementsByClassName('card open'); // live collection of all open cards 

const moveCount = document.querySelector('span.moves'); // element that displays moves
const stars = document.querySelectorAll('.stars li'); // elements that display star rating
const time = document.querySelector('.timer .time'); // element that displays time
const levels = document.querySelector('.level').level; // difficulty selector

const gameContainer = document.querySelector('.game-container'); // game main page
const deck = document.querySelector('ul.deck');
const congrats = document.querySelector('.congrats-container'); // showing when users win the game

let starNumber; // current number of stars
let gameLevel; // current game difficulty
let timerId; // interval id for updating time

const checkedCards = new Set(); // contains all cards that have been revealed, not including matched cards
const uncheckedCards = new Set(); // contains all cards that have not been revealed

const showCardDuration = 1000; // length of time for showing cards when they are not match


deck.addEventListener('click', clickCard); // listen to clicking on cards
document.querySelector('div.restart').addEventListener('click', restart); // restart button
document.querySelector('button.play-again').addEventListener('click', restart); // restart button on congrats page
document.querySelector('form.level').addEventListener('change', restart) // listen to changing difficulty

restart();


/**
 * @description Handle clicking on cards
 * @param {Event} evt
 */
function clickCard(evt) {

    const t = evt.target;

    /**
     * Ignore click when any of the following is true:
     * not clicking on an <li>,
     * already have 2 open cards,
     * the card has been matched,
     * the card is open.
     */
    if (
        t.tagName !== 'LI' ||
        openCards.length > 1 ||
        t.classList.contains('match') ||
        t.classList.contains('open')
    ) {
        return;
    }

    // Set timer
    if (timerId === undefined) {
        createTimer();
    }

    openCard(t);

    // If only 1 card is open, no further processing is needed.
    if (openCards.length < 2) {
        return;
    }

    updateScore();

    /**
     * If 2 open cards do not match, show card for a while.
     * Otherwise, check if they are match.
     */
    if (openCards[0].querySelector('i').className !== openCards[1].querySelector('i').className) {

        showCards();

    } else {

        matchCards();

        // If all cards are matched, end the game and show congrats page.
        if (matchedCards.length === cards.length) {

            winGame();
            return;
        }
    }

    /**
     * If the game difficulty is expert, 2 cards will be swapped every 3 moves.
     * At least one of the swapping cards must have been revealed.
     * Matched cards will not be swapped.
     * The last two cards of a game will not be swapped.
     */
    if (gameLevel === 'expert' &&
        moveCount.textContent !== '0' &&
        moveCount.textContent % 3 === 0 &&
        checkedCards.size > 0 &&
        checkedCards.size + uncheckedCards.size > 2) {

        swapCards();
    }
}


/**
 * @description Open a card
 * @param {Element} card 
 */
function openCard(card) {

    checkedCards.add(card);
    uncheckedCards.delete(card);
    card.classList.add('open');
}


/**
 * @description Show the open cards for a while
 */
function showCards() {

    setTimeout(() => {
        while (openCards.length > 0) {
            openCards[0].classList.remove('open');
        }
    }, showCardDuration);
}


/**
 * @description Match the open cards
 */
function matchCards() {

    while (openCards.length > 0) {

        checkedCards.delete(openCards[0]);
        openCards[0].classList.add('match');
        openCards[0].classList.remove('open');
    }
}


/**
 * @description Show the congrats page and display final scores
 */
function winGame() {

    // clear timer
    clearInterval(timerId);
    timerId = undefined;

    // display final scores
    document.querySelector('span.move-number').textContent = moveCount.textContent;
    document.querySelector('span.star-number').textContent = starNumber;
    document.querySelector('.final-level span').textContent = gameLevel;
    document.querySelector('.final-time span').textContent = time.textContent;
    displayStars(document.querySelectorAll('.final-stars i'), starNumber);

    setTimeout(() => {
        gameContainer.style.display = 'none';
        congrats.style.display = 'block';
    }, 2000);
}


/**
 * @description Update number of moves and star rating.
 */
function updateScore() {

    moveCount.textContent++;

    if (
        moveCount.textContent === '14' ||
        moveCount.textContent === '15' ||
        moveCount.textContent === '17' ||
        moveCount.textContent === '20'
    ) {
        starNumber--;
        displayStars(stars, starNumber);
    }
}


/**
 * @description Set specified number of Elements to be displayed, and hide the others.
 * @param {Array} elements an Array or array-like object of Elements
 * @param {Number} starNumber number of the elements to be displayed
 */
function displayStars(elements, starNumber) {

    for (let i = 0; i < elements.length; i++) {

        if (i < starNumber) {
            elements[i].style.display = 'inline-block';

        } else {
            elements[i].style.display = 'none';
        }
    }
}


/**
 * @description Randomly swap 2 cards with animation.
 * All swapping cards are picked from unmatched cards.
 */
function swapCards() {

    deck.removeEventListener('click', clickCard);

    setTimeout(() => {

        // pick one from cards that have been revealed
        const card1 = [...checkedCards.values()][randomInt(0, checkedCards.size)];

        // pick another from all unmatched cards
        const tempCards = new Set([...checkedCards]);
        tempCards.delete(card1);
        const card2 = [...tempCards.values(), ...uncheckedCards.values()][randomInt(0, tempCards.size + uncheckedCards.size)]

        flyCard(card1, card2.offsetLeft, card2.offsetTop);
        flyCard(card2, card1.offsetLeft, card1.offsetTop);

    }, showCardDuration * 0.8);
}


/**
 * @description Move a card to a destination with rotating animation.
 * @param {Element} card an element to move
 * @param {Number} destLeft offsetLeft property of the card's final position
 * @param {Number} destTop offsetTop property of the card's final position
 */
function flyCard(card, destLeft, destTop) {

    function setLeft(e, v) {
        e.style.left = v - e.offsetLeft + Number(e.style.left.slice(0, -2)) + 'px';
    }

    function setTop(e, v) {
        e.style.top = v - e.offsetTop + Number(e.style.top.slice(0, -2)) + 'px';
    }

    let rotate = 0;

    function step() {

        let speedL = 10;
        let speedT = 10;

        if (card.offsetLeft > destLeft) {
            speedL = -speedL;
        }
        if (card.offsetTop > destTop) {
            speedT = -speedT;
        }

        if (Math.abs(destLeft - card.offsetLeft) < Math.abs(speedL)) {
            speedL = 0;
        }
        if (Math.abs(destTop - card.offsetTop) < Math.abs(speedT)) {
            speedT = 0;
        }

        if (speedL === 0 && speedT === 0) {

            setLeft(card, destLeft);
            setTop(card, destTop);

            card.style.transform = '';

            setTimeout(() => {

                card.classList.add('flip');
                deck.addEventListener('click', clickCard);

            }, 0);


        } else {

            rotate += 23;

            setLeft(card, card.offsetLeft + speedL);
            setTop(card, card.offsetTop + speedT);

            card.style.transform = `rotate(${rotate}deg)`;

            requestAnimationFrame(step);
        }
    }
    card.classList.remove('flip');

    requestAnimationFrame(step);
}


/**
 * @description Create a timer, and display how many seconds has passed since the timer created.
 */
function createTimer() {

    const startTime = Date.now();

    const getTime = function () {
        return Math.floor((Date.now() - startTime) / 1000);
    }

    timerId = setInterval(() => time.textContent = getTime(), 500);
}


/**
 * @description Initialize the game:
 * close and shuffle all cards,
 * zero move count,
 * restore stars,
 * show the deck.
 * @param {Event} evt
 */
function restart(evt) {

    // If the game is end, a user can only restart it with the button on congrats page
    if (evt) {
        if (matchedCards.length === cards.length &&
            !evt.target.classList.contains('play-again')) {
            return;
        }
    }

    // clear timer
    clearInterval(timerId);
    timerId = undefined;

    for (const v of levels) {
        if (v.checked) {
            gameLevel = v.value;
        }
    }


    // reset all cards
    checkedCards.clear();

    [...cards].forEach((card, i, arr) => {

        card.className = 'card';
        uncheckedCards.add(card);

        swapClasses(
            card.querySelector('i'),
            arr[randomInt(i, arr.length)].querySelector('i')
        )
    });

    //to ensure no flipping animation when restarting
    setTimeout(() => {

        [...cards].forEach((card) => {
            card.classList.add('flip');
        });
    }, 0);

    // reset scores
    moveCount.textContent = 0;
    time.textContent = 0;

    starNumber = 5;
    displayStars(stars, starNumber);

    gameContainer.style.display = 'flex';
    congrats.style.display = 'none';
}


/**
 * @description Swap all classes of 2 elements.
 * @param {Element} element1
 * @param {Element} element2
 */
function swapClasses(element1, element2) {
    const temp = element1.className;
    element1.className = element2.className;
    element2.className = temp;
}


/**
 * @param {Number} min Minimum value
 * @param {Number} max Maximum value
 * @return {Number} an integer in the range from min inclusive up to but not including max
 */
function randomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}