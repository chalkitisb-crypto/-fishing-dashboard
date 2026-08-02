/* ==========================================
   FISHING DASHBOARD APP.JS
   Core Application Logic
========================================== */



document.addEventListener(
    "DOMContentLoaded",
    () => {


        console.log(
            "Fishing Dashboard Loaded"
        );



        /* ==========================
           LIVE DATE & TIME
        ========================== */


        function updateDateTime(){


            const now = new Date();


            const date =
            now.toLocaleDateString(
                "el-GR",
                {
                    day:"2-digit",
                    month:"2-digit",
                    year:"numeric"
                }
            );


            const time =
            now.toLocaleTimeString(
                "el-GR",
                {
                    hour:"2-digit",
                    minute:"2-digit"
                }
            );



            console.log(
                date,
                time
            );


        }



        updateDateTime();



        setInterval(
            updateDateTime,
            60000
        );









        /* ==========================
           BOTTOM NAVIGATION
        ========================== */



        const navButtons =
        document.querySelectorAll(
            ".bottom-navigation button"
        );



        navButtons.forEach(
            button => {


                button.addEventListener(
                    "click",
                    ()=>{


                        navButtons.forEach(
                            btn =>
                            btn.classList.remove(
                                "active"
                            )
                        );



                        button.classList.add(
                            "active"
                        );



                    }
                );


            }
        );









        /* ==========================
           TECHNIQUE SELECTOR
        ========================== */


        const techniques =
        document.querySelectorAll(
            ".techniques button"
        );



        techniques.forEach(
            technique=>{


                technique.addEventListener(
                    "click",
                    ()=>{


                        techniques.forEach(
                            item =>
                            item.classList.remove(
                                "selected"
                            )
                        );



                        technique.classList.add(
                            "selected"
                        );



                        localStorage.setItem(
                            "selectedTechnique",
                            technique.innerText
                        );


                    }
                );


            }
        );






        const savedTechnique =
        localStorage.getItem(
            "selectedTechnique"
        );



        if(savedTechnique){


            techniques.forEach(
                item=>{


                    if(
                        item.innerText === savedTechnique
                    ){

                        item.classList.add(
                            "selected"
                        );

                    }


                }
            );


        }









        /* ==========================
           LOGBOOK STORAGE
        ========================== */


        const addLogButton =
        document.querySelector(
            ".logbook .add-button"
        );



        let fishingLogs =
        JSON.parse(
            localStorage.getItem(
                "fishingLogs"
            )
        )
        ||
        [];



        if(addLogButton){


            addLogButton.addEventListener(
                "click",
                ()=>{


                    const entry = {


                        date:
                        new Date()
                        .toLocaleDateString(
                            "el-GR"
                        ),


                        fish:
                        "Νέα καταγραφή",


                        technique:
                        localStorage.getItem(
                            "selectedTechnique"
                        )
                        ||
                        "Spinning"


                    };



                    fishingLogs.push(
                        entry
                    );



                    localStorage.setItem(
                        "fishingLogs",
                        JSON.stringify(
                            fishingLogs
                        )
                    );



                    alert(
                        "Η καταγραφή αποθηκεύτηκε"
                    );


                }
            );


        }









        /* ==========================
           FISHING SPOTS STORAGE
        ========================== */


        const spotsButton =
        document.querySelector(
            ".spot-item button"
        );



        let spots =
        JSON.parse(
            localStorage.getItem(
                "fishingSpots"
            )
        )
        ||
        [];



        if(spotsButton){


            spotsButton.addEventListener(
                "click",
                ()=>{


                    const spot = {


                        name:
                        "Νέο Spot",


                        date:
                        new Date()
                        .toISOString()


                    };



                    spots.push(
                        spot
                    );



                    localStorage.setItem(
                        "fishingSpots",
                        JSON.stringify(
                            spots
                        )
                    );


                    alert(
                        "Το spot αποθηκεύτηκε"
                    );


                }
            );


        }
        /* ==========================
   DRAG & DROP WIDGET SYSTEM
========================== */


const widgets =
document.querySelectorAll(
    ".draggable"
);



let draggedWidget = null;



widgets.forEach(
    widget=>{


        widget.setAttribute(
            "draggable",
            true
        );



        widget.addEventListener(
            "dragstart",
            ()=>{


                draggedWidget = widget;


                widget.classList.add(
                    "dragging"
                );


            }
        );



        widget.addEventListener(
            "dragend",
            ()=>{


                widget.classList.remove(
                    "dragging"
                );


                draggedWidget = null;


                saveDashboardOrder();


            }
        );



        widget.addEventListener(
            "dragover",
            event=>{


                event.preventDefault();


            }
        );



        widget.addEventListener(
            "drop",
            ()=>{


                if(
                    draggedWidget &&
                    draggedWidget !== widget
                ){


                    const container =
                    widget.parentNode;



                    const allWidgets =
                    [...container.querySelectorAll(
                        ".draggable"
                    )];



                    const draggedIndex =
                    allWidgets.indexOf(
                        draggedWidget
                    );



                    const targetIndex =
                    allWidgets.indexOf(
                        widget
                    );



                    if(
                        draggedIndex <
                        targetIndex
                    ){

                        widget.after(
                            draggedWidget
                        );

                    }
                    else
                    {

                        widget.before(
                            draggedWidget
                        );

                    }


                }


            }
        );


    }
);









/* ==========================
   SAVE DASHBOARD ORDER
========================== */


function saveDashboardOrder(){


    const order = [];


    document
    .querySelectorAll(
        ".draggable"
    )
    .forEach(
        widget=>{


            order.push(
                widget.dataset.widget
            );


        }
    );



    localStorage.setItem(
        "dashboardOrder",
        JSON.stringify(
            order
        )
    );


}









/* ==========================
   LOAD DASHBOARD ORDER
========================== */


function loadDashboardOrder(){


    const saved =
    JSON.parse(
        localStorage.getItem(
            "dashboardOrder"
        )
    );



    if(!saved)
    return;



    const container =
    document.querySelector(
        ".app-container"
    );



    saved.forEach(
        id=>{


            const widget =
            document.querySelector(
                `[data-widget="${id}"]`
            );



            if(widget){

                container.appendChild(
                    widget
                );

            }


        }
    );


}



loadDashboardOrder();









/* ==========================
   CARD ANIMATION
========================== */


const cards =
document.querySelectorAll(
    ".card"
);



cards.forEach(
    (card,index)=>{


        card.style.opacity = "0";

        card.style.transform =
        "translateY(20px)";



        setTimeout(
            ()=>{


                card.style.transition =
                "all .4s ease";



                card.style.opacity =
                "1";



                card.style.transform =
                "translateY(0)";


            },
            index * 80
        );


    }
);









/* ==========================
   WEATHER DATA PLACEHOLDER
   (API READY)
========================== */


const fishingData = {


    temperature:28,

    wind:
    {
        direction:"ΒΔ",
        beaufort:4,
        speed:18
    },


    pressure:1015,


    waves:0.6,


    moon:72,


    score:82


};





function updateDashboard(){


    console.log(
        "Fishing Data",
        fishingData
    );


}



updateDashboard();









/* ==========================
   FUTURE API CONNECTIONS

   Weather:
   - AccuWeather API

   Wind:
   - Windy API

   Tides:
   - Tide API

   Moon:
   - Astronomical API

========================== */



});
