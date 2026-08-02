// Fishing Dashboard
// Main Application Logic


const fishingData = {


    "LRF": {

        score:92,

        message:
        "🟢 Ιδανικές συνθήκες για LRF - ήρεμη θάλασσα και χαμηλός άνεμος"

    },


    "Spinning": {

        score:87,

        message:
        "🟢 Πολύ καλές συνθήκες για Spinning - καλό ρεύμα και σταθερή πίεση"

    },


    "Shore Jigging": {

        score:78,

        message:
        "🟡 Καλές αλλά όχι ιδανικές συνθήκες - χρειάζεται περισσότερο κύμα"

    },


    "Εγγλέζικο": {

        score:90,

        message:
        "🟢 Εξαιρετικές συνθήκες για Εγγλέζικο - καθαρά νερά"

    }


};





const techButtons = document.querySelectorAll(".tech");

const score = document.getElementById("score");

const selectedTech = document.getElementById("selectedTech");

const techScore = document.getElementById("techScore");

const recommendation = document.getElementById("recommendation");







// Load saved technique

let savedTechnique = localStorage.getItem("fishingTechnique");



if(savedTechnique && fishingData[savedTechnique]) {

    updateTechnique(savedTechnique);

}








// Technique selection


techButtons.forEach(button => {


    button.addEventListener("click",()=>{


        const technique = button.dataset.tech;


        updateTechnique(technique);


        localStorage.setItem(
            "fishingTechnique",
            technique
        );


    });


});









function updateTechnique(technique) {


    const data = fishingData[technique];


    if(!data) return;





    // Score


    score.innerText = data.score;



    // Selected technique


    selectedTech.innerText = technique;



    // Technique score


    techScore.innerText = data.score;



    // Message


    recommendation.innerText = data.message;





    // Active button


    techButtons.forEach(button=>{


        button.classList.remove("active");



        if(button.dataset.tech === technique){

            button.classList.add("active");

        }


    });



}








// Simple startup animation


window.addEventListener("load",()=>{


    document.querySelector(".hero-card")
    .style.opacity="1";


});
