    
var App;
 
$( window ).resize(function() {
     location.reload();
});
 
var ancho = $( ".contenedor" ).width();
var candi = []
 
 
;(function(global, document, BUILD, $, d3, Handlebars){
 
    "use strict";  
 
    App = global.App = global.App || {};
 
    App.params = {
        width:ancho,
        selectedIds: []
    };
 
    //Data
    //App.dataUrl = 'https://docs.google.com/spreadsheet/pub?key=0AjbfzXKdfMPDdEozb3g3dVRCbWdlT2tjeWppUEZ1LXc&output=csv&gid=';
    App.dataFicha;
    App.dataCandidato;
    App.dataDetalle;
 
    //Components
    App.$contenedor = $(".contenedor");
    App.$slide = $(".slide");
    App.$candidatos = $(".candidatos");
    //App.$selectionContainer = $(".selected-candidatos");
    App.$selectContainer = $(".select-container");
    App.$sliderContainer = $(".slider-container");
    App.$select;
    App.$actionBtn = $("#ver-recorrido");
    App.$limpiarBtn = $("#limpiar");
    App.$sliderControl = $("#slider-control");
    App.$referenceblock = $(".reference-block");
    App.$creditosBtn = $("#creditos-btn");
 
    //Templates
    App.itemTemplate = Handlebars.compile($("#politico-item").html());
    App.selectListTemplate = Handlebars.compile($("#politico-select-list").html());
 
    //Vars
    App.page = 0;
    App.candidatosSelected = [];
    App.candidatosDetalleSelected = [];
    App.colors = ['red','green','purple','orange','yellow'];
 
    //Grap
    App.graph;
 
    /*SETUP START*/
 
    App.init = function() {
        App.getHash();
        App.setSizes();
 
        queue()
          .defer(d3.csv, BUILD+'https://docs.google.com/spreadsheets/d/e/2PACX-1vTDZ0UVUY9cl2IptqV5CwYKk1vO-c1chPdMS4KP35bKUkFLyyxjTKtaWEd_e471QumJtGZVR0PRycOH/pub?gid=1716811743&single=true&output=csv')
          .defer(d3.csv, BUILD+'https://docs.google.com/spreadsheets/d/e/2PACX-1vTDZ0UVUY9cl2IptqV5CwYKk1vO-c1chPdMS4KP35bKUkFLyyxjTKtaWEd_e471QumJtGZVR0PRycOH/pub?gid=0&single=true&output=csv')
          .defer(d3.csv, BUILD+'https://docs.google.com/spreadsheets/d/e/2PACX-1vTDZ0UVUY9cl2IptqV5CwYKk1vO-c1chPdMS4KP35bKUkFLyyxjTKtaWEd_e471QumJtGZVR0PRycOH/pub?gid=26713409&single=true&output=csv')
          .awaitAll(App.filesLoaded);
 
    };
 
    App.setSizes = function() {
        App.$contenedor.width(App.params.width);
        App.$candidatos.width(App.params.width);
    };
 
    App.getHash = function() {
        var hash = window.location.hash;
        App.params.selectedIds = (hash)?hash.substring(1).split('-').slice(0,4):[];
        candi = App.params.selectedIds;
        cargamosHash();
    };
 
    App.filesLoaded = function(error, results){
        App.graph = d3.politicos('timeline-candidatos',App.params.width,results[2]);
 
        App.dataLoaded(results[0]);
        App.detailsLoaded(results[1]);
 
        if(App.params.selectedIds.length>0){
            App.selectInitial();
        }
 
        /*if(ancho > 900){
            $(".ficha img").css({"left": ( (ancho / 10)-124 )});
        }else if(ancho < 600 && ancho > 400){
            $(".ficha img").css({"left": ( (ancho / 10)-74 ), "top":3});
            $("img").css({"width": "120%"});
        }else if(ancho < 401){
            $(".ficha img").css({"left": ( (ancho / 10)-44 ), "top":3});
            $("img").css({"width": "120%"});
        }else{
             $(".ficha img").css({"left": ( (ancho / 10)-114 )});
        }*/

        cierra();
 
    };
 
    App.detailsLoaded = function(data){
        App.dataDetalle = d3.nest()
            .key(function(d) { return parseInt(d.id_candidato); })
            .map(data.filter(function(e){return (e.partido==="NADA")?false:true;}), d3.map);
    };
 
    App.dataLoaded = function(data){
 
        App.dataFicha = data;
 
        App.dataCandidato =  d3.nest()
            .key(function(d) { return parseInt(d.id); })
            .map(App.dataFicha, d3.map);
 
        App.$actionBtn.on('click',App.updateGraph);
        App.$limpiarBtn.on('click',App.limpiar);
        App.createSlide();
        //App.$sliderControl.on('click',App.toggleSlider);
        App.createSelect();
 
        App.$creditosBtn.on('click',App.openCreditos);
 
    }
 
    App.openCreditos = function() {
        Shadowbox.open({
            content:    '#creditos-modal',
            player:     "inline",
            height:     432,
            width:      ancho,
            background: "#fff"
        });
    }
 
    App.limpiar = function() {
        if(!$(this).hasClass('disabled')){
            $.each(App.candidatosSelected,function(i,e){
                App.removeCandidato(e.id);
            });
            App.cleanGraph();
        }
    }
 
    App.selectInitial = function() {
        $.each(App.params.selectedIds,function(i,e){
            App.selectCandidato(parseInt(e));
        });
        App.updateGraph();
    }
 
    App.toggleSlider = function() {
        var h = (App.$sliderContainer.height()==0)?192:0;
        App.animateSliderContainer(h);
    }
 
    App.animateSliderContainer = function(h) {
        if(App.$sliderContainer.height()!=h){
            App.$sliderControl.toggleClass('mostrar');
            App.$sliderContainer.clearQueue().animate({  height:h }, 800, "easeInOutCirc");
        }
    }
 
    App.formatSelect = function(person,a,b) {
        var color = App.getColorCandidatosSelected(person.id);
        return "<span class='selected-reference selected-reference-"+color+"'><span class='white-bg'>" + person.text + "</span></span>" ;
    }
 
    App.createSelect = function(){
        App.$selectContainer.html(App.selectListTemplate(App.dataFicha));
        var options = {
            maximumSelectionSize: 5,
            placeholder: "Selecciona hasta 5 políticos",
            formatSelection: App.formatSelect,
            escapeMarkup:function (m) { return m;}
        };
        App.$select = $('#select-politicos').select2(options);
 
        App.$select.on("change",
                function(e) {
                    e.preventDefault();
                    if(e.added)
                        App.selectCandidato(e.added.id);
 
                    if(e.removed)
                        App.removeCandidato(e.removed.id);
 
 
                });
    }
 
    App.createSlide = function(){
        App.$slide.css('width',App.params.width);
        App.$slide.html(App.itemTemplate(App.dataFicha));
        App.$fichas = $('.ficha');
        App.$fichas.on('click',App.clickFicha);
        //App.$fichas.hover(App.mouseEnterFicha,App.mouseLeaveFicha);
 
       /* App.$fichas.each(function(){
            $(this).qtip({
                content: '<span>' + $(this).data('tooltip') + '</span>',
                position: {
                    my: 'center center',
                    at: 'top center',
                    target: 'mouse',
                    adjust: {
                        mouse: true,
                        y:30
                    }
                },
                show: {
                    solo: true
                },
                style: {
                    classes: 'qtip-candidato'
                }
            });
        });*/
    }
 
    /*SETUP END*/
 
    /*SELECT START*/
 
    App.mouseEnterFicha = function(){
        var f = $(this);
        if(!f.is(".disabled, .selected")){
            App.onFicha(f,App.colors[0],true);
        }
    };
 
    App.mouseLeaveFicha = function(){
        var f = $(this);
        if(f.hasClass('ficha-hover')){
            App.offFicha(f,App.colors[0],true);
        }
    };
 
    var info = "";
    var fixeds = "";
    var idf = "";
 
    App.clickFicha = function(){
        var f = $(this);
        idf = f.data('id');
 
        if(f.hasClass("selected") && !f.hasClass("ficha-hover") ){
            App.removeCandidato(f.data('id'));
 
            borramos();
 
        }else{
            if(App.candidatosSelected.length<5){
                App.selectCandidato(f.data('id'));
                App.updateGraph();
                cargamos();

                $('html, body').animate({ scrollTop: $(".slider-container").offset().top  }, 1000);  
                
            };
        };
 
       
    };

    function cargamosHash(){
        for (var i = 0; i < candi.length; i++) {

                        var nombre = canDatos[+candi[i]-1].nombre;
                        $("#tarj"+(+[i]+1)).addClass("cargada").data("id" , +candi[i]);
                        $("#cand"+(+[i]+1)).data("id" , +candi[i]);
 
                        info += '<div class="card">'
                        info += '<figure class="frente">'
                        //info += '<div class="flipoff"></div>';
                        info += '<div class="vermas" title="Ver más"><i class="fas fa-info"></i></div>';
                        info += '<div class="cerrar"><i class="fas fa-times"></i></div>'
                        info += '<img src="'+canDatos[+candi[i]-1].foto+'" border="0"/>'
                        info += '<div class="nom color-'+App.colors[i]+'">'+canDatos[+candi[i]-1].nombre+'<br><span class="partido">'+canDatos[+candi[i]-1].partido+'</span></div></figure>'
                        info += '<figure class="atras">'
                        //info += '<div class="flipon"></div>';
                        info += '<div class="vermenos" title="Ver menos">-</div>';
                        info += '<div class="nom">'+canDatos[+candi[i]-1].nombre+'</div>'
                        info += '<div class="twitter"><a href="http://twitter.com/'+canDatos[+candi[i]-1].twitter+'" target="_blank">'+canDatos[+candi[i]-1].twitter+'</a></div>'
                        info += '<div class="bio"><div class="edad"><span>Edad: </span>'+canDatos[+candi[i]-1].edad+'</div><div class="profesion"><span>Profesión: </span>'+canDatos[+candi[i]-1].profesion+'</div><div class="web"><span>Web: </span>';
                        if(canDatos[+candi[i]-1].link == "No posee"){
                          info += 'No posee web</div>';
                        }else{
                          info += '<a href="'+canDatos[+candi[i]-1].web+'" target="_blank">'+canDatos[+candi[i]-1].link+'</a></div>';
                        }
                        info += '<div class="texto">'+canDatos[+candi[i]-1].bio+'</div></div>'
                        info += '<div class="cerrar"><i class="fas fa-times"></i></div>'
                        info += '</figure></div>'
                       
                        var $cont_flip = $("#tarj"+(+[i]+1));
                        $cont_flip.html(info);
                        $(".card", $cont_flip).delay(200).fadeIn(500);
                        App.flipea($cont_flip);

                        //fixeds += '<div class="candi color-'+App.colors[i]+'2 " data-id="'+candi[i]+'">'+canDatos[+candi[i]-1].nombre+'</div>';
                        $("#cand"+(+[i]+1)).addClass('color-'+App.colors[i]+'2').html(canDatos[+candi[i]-1].nombre);


        };


       $( window ).scroll(function() {
          var posicion = $(document).scrollTop();
          
          if(posicion > 500 && posicion < 1500){
            $(".cajaFixed").fadeIn(100);
          }else{
            $(".cajaFixed").fadeOut(100);
          }

       });
       
               
    }
 
    function cargamos(){
            var pasa = 0;
            var candidato = App.getDataCandidato(idf);
            
            for (var i = 1; i < 6; i++) {
  
 
                    if( $("#tarj"+[i]).hasClass( "cargada" ) || pasa == 1 ){

                    }else{
                        pasa = 1;
                        info = "";

                        var nombre = canDatos[(idf-1)].nombre;
                        $("#tarj"+[i]).addClass("cargada").data("id" , idf);
     
                        info += '<div class="card">';
                        info += '<figure class="frente">';
                        //info += '<div class="flipoff"></div>';
                        info += '<div class="vermas" title="Ver más"><i class="fas fa-info"></i></div>';
                        info += '<div class="cerrar"><i class="fas fa-times"></i></div>'
                        info += '<img src="'+canDatos[(idf-1)].foto+'" border="0"/>';
                        info += '<div class="nom color-'+candidato.color+'">'+canDatos[(idf-1)].nombre+'<br><span class="partido">'+canDatos[(idf-1)].partido+'</span></div></figure>';
                        info += '<figure class="atras">';
                        //info += '<div class="flipon"></div>';
                        info += '<div class="vermenos" title="Volver">-</div>';
                        info += '<div class="nom color-'+candidato.color+'">'+canDatos[(idf-1)].nombre+'</div>';
                        info += '<div class="twitter"><a href="http://twitter.com/'+canDatos[(idf-1)].twitter+'" target="_blank">'+canDatos[(idf-1)].twitter+'</a></div>';
                        info += '<div class="bio"><div class="edad"><span>Edad: </span>'+canDatos[(idf-1)].edad+'</div><div class="profesion"><span>Profesión: </span>'+canDatos[(idf-1)].profesion+'</div><div class="web"><span>Web: </span>';
                        if(canDatos[(idf-1)].link == "No posee"){
                          info += 'No posee web</div>';
                        }else{
                          info += '<a href="'+canDatos[(idf-1)].web+'" target="_blank">'+canDatos[(idf-1)].link+'</a></div>';
                        }
                        info += '<div class="texto">'+canDatos[(idf-1)].bio+'</div></div>';
                        info += '<div class="cerrar"><i class="fas fa-times"></i></div>'
                        info += '</figure></div>';

                        //fixeds += '<div class="candi color-'+candidato.color+'2 " data-ids="">'+canDatos[(idf-1)].nombre+'</div>';
                        //$(".cajaFixed").html(fixeds);
                        $("#cand"+[i]).addClass('color-'+candidato.color+'2').html(canDatos[(idf-1)].nombre);
                       
                        var $cont_flip = $("#tarj"+[i]);
                        $cont_flip.html(info);
                        $(".card", $cont_flip).delay(200).fadeIn(500);
                        App.flipea($cont_flip);

                   };

                   
           };



           $( window ).scroll(function() {
              var posicion = $(document).scrollTop();
              
              if(posicion > 500 && posicion < 1500){
                $(".cajaFixed").fadeIn(100);
              }else{
                $(".cajaFixed").fadeOut(100);
              }

           });
 
 
           cierra();
 
   }
 
   function borramos(){
 
       var pasa = 0
       for (var i = 1; i < 6; i++) {
 
           if( $("#tarj"+[i]).data( "id" ) == idf ){
 
               var info = "";
               info += '<div class="sincard"><div class="seleccione">Selecciona un candidato para mostrar su información</div><div class="mas"></div></div>'
               $("#tarj"+[i]).removeClass( "cargada" ).html(info);
               $("#tarj"+[i]).data("id" , " ");

                $( "#cand"+[i] ).removeClass( "color-red2" ).html("");
                $( "#cand"+[i] ).removeClass( "color-green2" )
                $( "#cand"+[i] ).removeClass( "color-orange2" )
                $( "#cand"+[i] ).removeClass( "color-purple2" )
                $( "#cand"+[i] ).removeClass( "color-yellow2" )
 
           };
 
       }

      
 
   }

   setInterval('scrolling()', 1000);

   function scrolling(){
      $(".texto").niceScroll({
                        cursorcolor:"#d7d7d7",
                        cursorborder:"0px solid #fff",
                        cursorwidth: "7px",
                        autohidemode:false,
                        hidecursordelay:0,
                        background:"#f7f7f7"
                  });
   }
 
   
   App.flipea = function($cont_flip){ 
       
       $(".vermas, .vermenos", $cont_flip).click(function(){
                var ids = $(this).parent().parent().parent().attr('id');
               //$( "#"+ids+" .card" ).toggleClass( "flipped" );
               $( "#"+ids+" .card .atras" ).fadeToggle(200)

       });
 
   }
 
   function cierra(){
       $(".cerrar").click(function(){
            var ids = $(this).parent().parent().parent().attr('id');
            var info = "";
            info += '<div class="sincard"><div class="seleccione">Selecciona un candidato para mostrar su información</div><div class="mas"></div></div>'
            $( "#"+ids ).removeClass( "active, cargada" ).html(info);
            App.removeCandidato($( "#"+ids ).data("id"));
            $( "#"+ids ).data("id" , " ");

            var id = ids.split("tarj")
            $( "#cand"+id[1] ).removeClass( "color-red2" ).html("");
            $( "#cand"+id[1] ).removeClass( "color-green2" )
            $( "#cand"+id[1] ).removeClass( "color-orange2" )
            $( "#cand"+id[1] ).removeClass( "color-purple2" )
            $( "#cand"+id[1] ).removeClass( "color-yellow2" )
 
       });

       
   }


 
   App.onFicha = function(f,color,hover){
       if(hover){
           f.addClass("ficha-hover");
       } else {
           f.removeClass("ficha-hover");
       }
       f.addClass("selected");
       f.addClass('border-color-'+color);
       f.find('.check').addClass('color-'+color);

   };
 
   App.offFicha = function(f,color,hover){
       if(hover){
          f.removeClass("ficha-hover");
       }
       f.removeClass("selected");
       f.removeClass('border-color-'+color);
       f.find('.check').removeClass('color-'+color);
   };
 
   App.setSelectedHash = function(){
       window.location.hash = App.candidatosSelected
           .reduce(function(previousValue, currentValue, index, array){
               return (previousValue)?previousValue + '-' + currentValue.id:'' + currentValue.id;
             }
             ,''
           );
   };
 
   App.selectCandidato = function(id){
 
       var candidato = App.getDataCandidato(id),
           f = App.$slide.find('#ficha-'+id);
       
       //Slider
       candidato.color = App.colors.shift();
 
       //CSS de la ficha
       App.onFicha(f,candidato.color,false);
 
       //Selected
       App.candidatosSelected.push(candidato);
       
       //Data for graph
       App.candidatosDetalleSelected = App.candidatosDetalleSelected.concat(App.getDetalleCandidato(id));
 
       //Select
       var m = App.$select.select2("val");
       App.$select.select2("val",m.concat([id+""]));
       
       //Check
       App.checkLimit();
   };
 
   App.removeCandidato = function(id){
       var f = App.$slide.find('#ficha-'+id);
           
       //Selected
       var m = [];
       App.candidatosSelected = App.candidatosSelected.filter(function(a){
           if(a.id==id){
               App.colors.push(a.color);
               App.offFicha(f,a.color,false);
               return false;
           }
           m.push(a.id+"");
           return true;
       });
 
       App.candidatosDetalleSelected = App.candidatosDetalleSelected.filter(function(a){
           if(a.id_candidato==id){
               return false;
           }
           return true;
       });
       
       //Select
       App.$select.select2("val",m);
 
       App.checkLimit();
       App.updateGraph();
   };
 
   App.getColorCandidatosSelected = function(id){
       var r = App.candidatosSelected.filter(function(a){
           if(a.id==id){
               return true;
           }
           return false;
       })[0];
 
       r = (r)?r.color:false;
 
       return r;
   };
 
   App.cleanGraph = function(){
       //App.animateSliderContainer(192);
       App.graph.update([],[]);
   };
 
   App.updateGraph = function(){
       if(!$(this).hasClass('disabled')){
           //$('body,html').animate({scrollTop : 155},'slow');
           App.$referenceblock.show();
           App.setSelectedHash();
           //App.animateSliderContainer(0);
           App.graph.update(App.candidatosDetalleSelected,App.candidatosSelected);
       }
   };
 
   App.checkLimit = function(){
       //fichas
       if(App.candidatosSelected.length==5){
           App.$slide.find('.ficha').not('.selected').addClass('disabled');
       } else if (App.$slide.find('.disabled').size()>0){
           App.$slide.find('.ficha').not('.selected').removeClass('disabled');
       }
 
       //btn
       if(App.candidatosSelected.length==0){
           App.$limpiarBtn.addClass('disabled');
           App.$actionBtn.addClass('disabled');
       }else if(App.candidatosSelected.length==1){
           App.$actionBtn.html("VER RECORRIDO").removeClass('disabled');
           App.$limpiarBtn.removeClass('disabled');
       }else{
           App.$actionBtn.html("COMPARAR");
       }
   };
 
   App.getDataCandidato = function(id){
       return App.dataCandidato.get(id)[0];
   };
 
   App.getDetalleCandidato = function(id){
       return (App.dataDetalle.get(id))?App.dataDetalle.get(id):[];
   };
 
   /*SELECT END*/
 
 
})(window, document, BUILD, jQuery, d3, Handlebars);
 
window.onload = function() {
   var opts = {
       fb:{
           title:'El laberinto político de los candidatos',
           text:'Visualizá el camino que realizaron los candidatos a través de las últimas elecciones. En qué partido estuvieron y con quiénes. - lanacion.com'
       },
       tw:{
           text:'Conocé el laberinto político de los candidatos',
           related : 'lndata',
           via: 'lanacioncom',
           ht: 'ddj,dataviz'
       },
       em:{
           subject:'El laberinto político de los candidatos',
           body:'Visualizá el camino que realizaron los candidatos a través de las últimas elecciones. En qué partido estuvieron y con quiénes.'
       },
       getUrl: function(via){
           //return 'http://interactivos.lanacion.com.ar/candidatos/'+window.location.hash;
           return window.location.origin+window.location.pathname+window.location.hash;
       }
   };
 
   App.init();
   MiniShare.init(opts);
   Shadowbox.init();
 
}
