// Fishing Dashboard V1


const techniques = {


    "LRF": {

        score:92,

        message:"🟢 Ιδανικές συνθήκες για LRF - ήρεμη θάλασσα και χαμηλός άνεμος"

    },


    "Spinning": {

        score:87,

        message:"🟢 Πολύ καλές συνθήκες για Spinning - καλό ρεύμα και σταθερή πίεση"

    },


    "Shore Jigging": {

        score:78,

        message:"🟡 Μέτριες συνθήκες - χρειάζεται περισσότερο κύμα"

    },


    "Εγγλέζικο": {

        score:90,

        message:"🟢 Εξαιρετικές συνθήκες για Εγγλέζικο - καθαρή θάλασσα"

    }


};






const buttons = document.querySelectorAll(".tech");

const scoreNumber = document.querySelector(".score-value");

const selectedTech = document.querySelector(".selected-tech");

const messageBox = document.querySelector(".score-message");






buttons.forEach(button => {


    button.addEventListener("click",()=>{


        const techName = button.innerText;


        const data = techniques[techName];



        if(!data) return;





        // αλλαγή ενεργού κουμπιού


        buttons.forEach(btn=>{

            btn.classList.remove("active");

        });


        button.classList.add("active");






        // αλλαγή score


        scoreNumber.innerText = data.score;





        // αλλαγή τεχνικής


        selectedTech.innerHTML =

        `
        🎯 Επιλεγμένη:
        <strong>${techName}</strong>

        <br>

        Fishing Score:
        <strong>${data.score}</strong>
        `;





        // αλλαγή μηνύματος


        messageBox.innerText = data.message;



    });


});
