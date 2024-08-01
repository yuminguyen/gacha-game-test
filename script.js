let cards = [];
let totalWeight = 0;
let spinCount = 0;
let baseSSRWeight = 1; // Trọng số cơ bản của thẻ SSR
let increasePercentage = 0.2;
let currentSSRWeight = baseSSRWeight; // Trọng số của thẻ đang có
let receivedSSR = false; // Biến theo dõi việc nhận thẻ SSR
let roundSpinCount = 0; //Biến theo dõi lượt quay
let cardCounts = {}; //Biến lưu số lần rút của từng thẻ

function loadCards(callback) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'card-list.json', true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            cards = JSON.parse(xhr.responseText);
            totalWeight = calculateTotalWeight(cards);
            callback();
        }
    };
    xhr.send();
}

// Tính tổng trọng số
function calculateTotalWeight(cards) {
    return cards.reduce((sum, card) => sum + card.weight, 0);
}

// Hàm cập nhật trọng số của thẻ SSR
function adjustSSRWeight(cards, roundSpinCount) {

    // Tính số lần quay sau 60 lượt quay
    const incrementCount = Math.floor(roundSpinCount / 10) - 6;
    const adjustedSSRWeight = baseSSRWeight + Math.max(0, incrementCount * increasePercentage);

    // Cập nhật trọng số cho thẻ SSR
    cards.forEach(card => {
        if (card.type === 'SSR') {
            card.weight = adjustedSSRWeight;
        }
    });

    return calculateTotalWeight(cards);
}

// Hàm rút 1 lần
function spinOnce() {
    spinCount++;
    roundSpinCount++;
    totalWeight = adjustSSRWeight(cards, roundSpinCount);

    const random = Math.random() * totalWeight;
    let cumulativeWeight = 0;
    receivedSSR = false;

    for (const card of cards) {
        cumulativeWeight += card.weight;
        if (random < cumulativeWeight) {
            if (card.type === 'SSR') {
                receivedSSR = true;
                console.log(`Rút được thẻ SSR với trọng số: ${card.weight}`);
            }
            //Cập nhật số lần rút của thẻ
            cardCounts[card.id] = (cardCounts[card.id] || 0) + 1;
            updateSpinCountDisplay();
            return card;
        }
    }
    updateSpinCountDisplay();
    return null;
}

// Hàm rút 10 lần
function spinMultiple(times) {
    const results = [];

    for (let i = 0; i < times; i++) {
        const result = spinOnce();
        if (result) {
            results.push(result);
        }
    }

    // Kiểm tra nếu không có thẻ SR thì sẽ thêm một thẻ SR ngẫu nhiên
    if (!results.some(card => card && card.type === 'SR')) {
        // Tìm thẻ SR
        const srCards = cards.filter(card => card.type === 'SR');
        if (srCards.length > 0) {
            // Chọn ngẫu nhiên một thẻ SR từ danh sách thẻ SR
            const randomSrCard = srCards[Math.floor(Math.random() * srCards.length)];
            
            //Thay thế 1 thẻ ngẫu nhiên trong kết quả
            const randomIndex = Math.floor(Math.random() * results.length);
            results[randomIndex] = randomSrCard;

            cardCounts[randomSrCard.id] = (cardCounts[randomSrCard.id] || 0) + 1;
        }
    }

    // Đảm bảo có ít nhất một thẻ SSR trong lượt quay 80-90
    if (roundSpinCount > 80 && roundSpinCount <= 90 && !results.some(card => card && card.type === 'SSR')) {
        const ssrCards = cards.filter(card => card.type === 'SSR');
        if (ssrCards.length > 0) {
            //Chọn ngẫu nhiên 1 thẻ SR từ danh sách thẻ SSR
            const randomSsrCard = ssrCards[Math.floor(Math.random() * ssrCards.length)];
            
            //Thay thế 1 thẻ ngẫu nhiên trong kq
            const randomIndex = Math.floor(Math.random() * results.length);
            results[randomIndex] = randomSsrCard;

            cardCounts[randomSsrCard.id] = (cardCounts[randomSsrCard.id] || 0) + 1;
        }
    }

    // Hiển thị trọng số của thẻ SSR trong console
    results.forEach(card => {
        if (card && card.type === 'SSR') {
            console.log(`Thẻ SSR rút được với trọng số: ${card.weight}`);
        }
    });    

    updateSpinCountDisplay();
    return results;
}

// Cập nhật giao diện với hình ảnh
function updateCharacterImg(result) {
    const imageElement = document.getElementById('characterImage');
    imageElement.innerHTML = ''; // Xóa kết quả cũ

    // Định nghĩa màu sắc border cho từng loại thẻ
    const borderColors = {
        'N': '#d3d3d3',
        'R': 'blue',
        'SR': '#e41aff',
        'SSR': 'gold'
    };

    result.forEach(character => {
        //console.log('Character to display:', character); // Debugging
        if (character && character.image) { // Kiểm tra kq
            const newImage = document.createElement('div');
            newImage.style.backgroundImage = `url(${character.image})`;
            newImage.style.width = '20vh';
            newImage.style.height = '20vh';
            newImage.style.backgroundSize = 'cover';
            newImage.style.border = `0.25vh solid ${borderColors[character.type] || 'black'}`; // Cập nhật màu border theo loại thẻ
            newImage.style.borderRadius = '1vh';
            newImage.style.backgroundPosition = 'center';
            newImage.style.cursor = "pointer";
            newImage.classList.add('hover-shadow', 'cursor');
            imageElement.appendChild(newImage);
        } else {
            console.error('Received an invalid character: ', character);
        }
    });
}

// Hàm cập nhật số lượt quay
function updateSpinCountDisplay() {
    const spinCountDisplay = document.getElementById('spinCountDisplay');
    spinCountDisplay.textContent = `Số lần quay: ${spinCount}`;

    spinCountDisplay.style.color = 'white';
}

// Rút 1 lần
document.getElementById('spinButton1').addEventListener('click', function() {
    if (cards.length === 0) {
        console.error('No cards loaded');
        return;
    }
    const selectedCharacter = spinOnce();
    if (selectedCharacter) {
        updateCharacterImg([selectedCharacter]);
        updateCharactersTab([selectedCharacter]);
        if (receivedSSR) {
            // Reset trọng số trở về cơ bản sau khi nhận thẻ SSR
            currentSSRWeight = baseSSRWeight;
            totalWeight = adjustSSRWeight(cards, roundSpinCount);
            roundSpinCount = 0;
        }
    } else {
        console.error('Failed to spin once');
    }
    updateSpinCountDisplay(); // Cập nhật số lượt quay
});

// Rút 10 lần
document.getElementById('spinButton10').addEventListener('click', function() {
    if (cards.length === 0) {
        console.error('No cards loaded');
        return;
    }
    const results = spinMultiple(10);
    if (results.length > 0) {
        updateCharacterImg(results);
        updateCharactersTab(results);
        if (results.some(card => card && card.type === 'SSR')) {
            // Reset trọng số trở về cơ bản nếu có thẻ SSR trong kết quả
            currentSSRWeight = baseSSRWeight;
            totalWeight = adjustSSRWeight(cards, spinCount);
            roundSpinCount = 0;
        }
    } else {
        console.error('Failed to spin multiple times');
    }
    updateSpinCountDisplay(); // Cập nhật số lượt quay
});

function openTab(evt, idtab) {
    var i, gachatab, container;

    container = document.getElementsByClassName("container");
    for (i = 0; i < container.length; i++) {
        container[i].style.display = "none";
    }

    gachatab = document.getElementsByClassName("gachatab");
    for (i = 0; i < gachatab.length; i++) {
        gachatab[i].className = gachatab[i].className.replace(" active", "");
    }

    document.getElementById(idtab).style.display = "block";
    evt.currentTarget.className += " active";
}

// Hàm gọi card-list vào tab Characters
document.addEventListener('DOMContentLoaded', function() {
    // Định nghĩa màu sắc border cho từng loại thẻ
    const borderColors = {
        'N': '#d3d3d3', // Xám
        'R': 'blue', // Xanh lam
        'SR': '#e41aff', // Tím
        'SSR': 'gold' // Vàng
    };

    fetch('cards-list.json')
        .then(response => response.json())
        .then(data => {
            const gallery = document.getElementById('character-gallery');
            data.forEach(card => {
                const div = document.createElement('div');
                div.classList.add('character-list');
                div.setAttribute('data-card-id', card.id); //Thêm thuộc tính data-card-id
                div.style.border = `0.25vh solid ${borderColors[card.type] || 'black'}`; // Áp dụng màu border dựa trên loại thẻ
                div.style.position = 'relative'; // Đặt vị trí của thẻ là relative để chứa ảnh nhỏ
                div.innerHTML = `
                    <img src="${card.image}" class="hover-shadow cursor" alt="Character">
                    <div class="small-image" style="
                        background-image: url(${card.smallImage});
                        width: 6vh;
                        height: 3vh;
                        background-size: cover;
                        background-position: center;
                        position: absolute;
                        top: 0.2vh;
                        left: 0.2vh;
                    "></div>
                `;                
                gallery.appendChild(div);
            });
        }).catch(error => console.error('Error loading the JSON file:', error));
});

//Hàm thay thế các thẻ trong tab Characters
function updateCharactersTab(result) {
    const gallery = document.getElementById('character-gallery');
    const cards = gallery.getElementsByClassName('character-list');

    //Tạo một đối tượng để ánh xạ các id thẻ với id ảnh mới
    const cardImgMap = {};
    result.forEach(character => {
        if (character && character.id && character.image) {
            //cardImgMap[character.id] = character.image;
            cardImgMap[character.id] = {
                image: character.image,
                count: cardCounts[character.id] || 0,
                smallImage: character.smallImage
            };
        }
    });

    //Cập nhật các thẻ trong tab Characters
    Array.from(cards).forEach(cardDiv => {
        const cardId = cardDiv.getAttribute('data-card-id');
        if (cardImgMap[cardId]) {
            const imgElement = cardDiv.querySelector('img');
            imgElement.src = cardImgMap[cardId].image;

            //Cập nhật số lần rút
            let countDiv = cardDiv.querySelector('.count');
            if (!countDiv) {
                countDiv = document.createElement('div');
                countDiv.classList.add('count');
                cardDiv.appendChild(countDiv);
            }
            countDiv.textContent = cardImgMap[cardId].count;
        }
    });
}

window.onload = function() {
    loadCards(function() {
        document.getElementById("defaultOpen").click(); // Mở tab mặc định
    });
};