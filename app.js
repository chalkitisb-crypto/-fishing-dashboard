// Fishing Dashboard
// Main Logic


const fishingProfiles = {

    "LRF": {

        score:92,

        alert:
        "🟢 Ιδανικός άνεμος και ήρεμη θάλασσα για LRF"

    },


    "Spinning": {

        score:87,

        alert:
        "🟢 Καλές συνθήκες για Spinning - ενεργά σημεία με ρεύμα"

    },


    "Shore Jigging": {

        score:78,

        alert:
        "🟡 Μέτριες συνθήκες - καλύτερα με περισσότερο κύμα"

    },


    "Εγγλέζικο": {

        score:90,

        alert:
        "🟢 Εξαιρετικές συνθήκες για Εγγλέζικο"

    }

};





const techniqueButtons =
document.querySelectorAll(".techniques button");



const scoreNumber =
document.querySelector(".circle-score");



const selectedTechnique =
document.querySelector(".selected-tech");



const alertBox =
document.querySelector(".green");





// Load saved technique

let currentTechnique =
localStorage.getItem("technique") || "LRF";



updateDashboard(currentTechnique);






// Buttons


techniqueButtons.forEach(button => {


    button.addEventListener("click",()=>{


        const technique =
        button.innerText;


        updateDashboard(technique);



        localStorage.setItem(
            "technique",
            technique
        );


    });


});








function updateDashboard(technique){


    const data =
    fishingProfiles[technique];



    if(!data) return;





    // Score


    if(scoreNumber){

        scoreNumber.innerText =
        data.score;

    }





    // Selected technique


    if(selectedTechnique){

        selectedTechnique.innerHTML =

        `
        🎯 Επιλεγμένη:
        <b>${technique}</b>
        `;

    }





    // Alert


    if(alertBox){

        alertBox.innerText =
        data.alert;

    }





    // Active button


    techniqueButtons.forEach(button=>{


        button.classList.remove("active");



        if(button.innerText === technique){

            button.classList.add("active");

        }


    });


}








// Demo dynamic conditions


const pressureTrend =
document.querySelector(".pressure");



if(pressureTrend){

    pressureTrend.style.height =
    "45px";

}







// Future modules placeholders


document.addEventListener(
"DOMContentLoaded",
()=>{


console.log(
"Fishing Dashboard Loaded"
);


});
