var RPi;

function RaspberryPi(model, stage3d)
{
    'use strict'
    var self = this;
    this.model = $( model );
    this.rotateX = 70;
    this.rotateY = 0;
    this.rotateZ = 40;
    this.connected = true;
    this.infoBox = $(".info-content")

    this.processes = [];

    this.traqball = new Traqball({
        stage: stage3d,
        //axis: [0.5,1,0,0.25],
        prespective: 1000
    });

    this.components = {
        ethernet:   new HWComponent("ethernet", this),
        usb:        new HWComponent("usb", this),
        cpu:        new HWComponent("cpu", this),
        ram:        new HWComponent("ram", this),
        sd:         new HWComponent("sd", this)
    };

    /*
    this.ledsControl = {

        leds: [
            $("led1"),
            $("led2"),
            $("led3"),
            $("led4"),
            $("led5")
        ],
        ledTimer: setTimer(function(){
            if()
        },10)
    }*/



    this.initSelf();
}

RaspberryPi.prototype.initSelf = function ()
{
    'use strict'
    var self = this;

    $("#default_button").click(function (){
        self.defaultPosition();
    });
    $("#logout_button").click(function(){
        sessionStorage.setItem("socketIOtoken", "")
    })


    this.socket = io("/sysStat", {
      'query': 'token=' + sessionStorage.getItem("socketIOtoken")
    });

    this.socket.on("info", function(data){
        console.log(data)
        self.processes = data.processes;
        self.update();
    });


    // TODO: make the error hadeling work
    this.socket.on("error", function(error) {
        console.log("error")
        if (error.type == "UnauthorizedError" || error.code == "invalid_token") {
            console.log("Invalid token");

        }
    });
};

RaspberryPi.prototype.defaultPosition = function ()
{
    'use strict'
    //this.traqball.disable();
    this.model.addClass( "picontainer_mover" );
    this.model.css( "-webkit-transform", "rotateX(58deg) rotateY(0deg) rotateZ(45deg)");
    this.model.css( "transform", "rotateX(58deg) rotateY(0deg) rotateZ(45deg)" );
    var self = this;
    setTimeout(function(){
        self.model.removeClass( "picontainer_mover" );
        //self.traqball.activate();
    },500);


};

RaspberryPi.prototype.hideAll = function()
{
    'use strict'
    for(var key in this.components)
    {
        var comp = this.components[key];
        if(comp.out)
        {
            comp.animateIn();
        }
    }
}

RaspberryPi.prototype.renderInfo = function(comp)
{
    if( comp == null)
    {
        this.infoBox.html("<div id='default_info_content'>Click one of the components on the model to get information about it.</div>")
    }
    else
    {
        this.infoBox.html("");
    }
}

RaspberryPi.prototype.update = function()
{
    this.renderProcList();

}

RaspberryPi.prototype.renderProcList = function()
{
    var self = this;
    var list = $("#processList > tbody");
    list.html("")
    var row = []
    var i = 0;
    for (proc in this.processes) {
        row = [];
        i = 0;

        row[i++] = "<tr>";
        row[i++] = "<td>" + this.processes[proc].pid + "</td>";
        row[i++] = "<td>" + this.processes[proc].user + "</td>";
        row[i++] = "<td>" + this.processes[proc].cpu + "</td>";
        row[i++] = "<td>" + this.processes[proc].mem + "</td>";
        row[i++] = "<td>" + this.processes[proc].vir + "</td>";
        row[i++] = "<td>" + this.processes[proc].time + "</td>";
        row[i++] = "<td>" + this.processes[proc].command + "</td>";
        row[i++] = "</tr>";

        list.append(row.join(""))
    }
}


function HWComponent( id, rpi )
{
    'use strict'
    var self = this;
    this.parentRPi = rpi;
    this.id = id;
    this.element = $("."+id );
    this.moverClassOut = id + "-mover-out";
    this.moverClassIn = id + "-mover-in";
    this.moverClassExt = id + "-ext";
    this.out = false;



    this.element.click(function ()
    {
        self.parentRPi.traqball.disable();

        if (self.out === false)
        {
            self.parentRPi.hideAll();
            self.parentRPi.renderInfo(self.id);
            if (self.id == "cpu")
            {
                self.parentRPi.components.ram.animateOut();
            }
            if (self.id == "ram")
            {
                self.parentRPi.components.cpu.animateOut();
            }

            self.parentRPi.defaultPosition();
            setTimeout(function() {
                self.animateOut();
            }, 500);
        }
        else
        {
            self.parentRPi.renderInfo(null);
            if (self.id == "cpu")
            {
                self.parentRPi.components.ram.animateIn();
            }
            if (self.id == "ram")
            {
                self.parentRPi.components.cpu.animateIn();
            }
            self.animateIn();
            setTimeout(function() {
                self.parentRPi.traqball.activate();
                console.log("Activated")
            }, 500);
        }
    });
}

HWComponent.prototype.animateOut = function()
{
    'use strict'
    var self = this;
    this.element.addClass(this.moverClassOut);
    this.element.bind("animationend webkitAnimationEnd oAnimationEnd MSAnimationEnd", function(){
        self.element.addClass(self.moverClassExt);
        self.element.removeClass(self.moverClassOut);
        self.element.unbind("animationend webkitAnimationEnd oAnimationEnd MSAnimationEnd");
    });
    this.out = true;
};

HWComponent.prototype.animateIn = function()
{
    'use strict'
    var self = this;
    this.element.removeClass(this.moverClassExt);
    this.element.addClass(this.moverClassIn);

    this.element.bind("animationend webkitAnimationEnd oAnimationEnd MSAnimationEnd", function(){
        self.element.removeClass(self.moverClassIn);
        self.element.unbind("animationend webkitAnimationEnd oAnimationEnd MSAnimationEnd");
    });
    this.out = false;
};

$(document).ready(function()
{
    RPi = new RaspberryPi(".pi", "stage");

});
