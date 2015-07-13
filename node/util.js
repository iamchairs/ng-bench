module.exports = {
  pullMethod: pullMethod
};

/**
 *
 * returns object
 *         * firstHalf : string
 *         * lastHalf : string
 *         * method: string
 */
function pullMethod(str, method) {

  var start = str.indexOf(method);
  
  if(start === -1) {
    return null;
  }

  var end = -1;
  var cont = true;
  var methodOpened = false;
  var i = start;
  var methodLevel = 0;

  if (start) {

    while (cont) {
      var chr = str[i];

      if (chr === '{') {
        if(!methodOpened) {
          methodOpened = true;
        } else {
          methodLevel++;
        }
      } else if (chr === '}') {
        methodLevel--;
        if(methodLevel < 0) {
          end = i+1;
          cont = false;
        }
      }

      i++;
    }

    if(end !== -1) {
      var firstHalf = str.substr(0, start);
      var methodStr = str.substr(start, end - start);
      var lastHalf = str.substr(end, str.length -end);
      
      return {
        firstHalf: firstHalf,
        lastHalf: lastHalf,
        method: methodStr
      };
    } else {
      console.log('could not find the end of ' + method);
    }

  } else {
    console.log('could not find the start of ' + method);
  }

}