const functionList = {
    fallback:{
        onLoad: function(linker, parent){
            parent.preload(linker);
            parent.complete(linker);
        },
        onComplete: function(linker, parent){
            parent.gonext(linker);
        }
    }
};
