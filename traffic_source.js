(function(cookieName, domain){
    
    /* Getting started:
    * Change the site_hostname from "subdomain.domain.com" to your own website
    * Change .YOUR-DOMAIN-HERE.com" at the bottom of the script.
    * Other settings are optional - you are good to go!
    * Credit: https://github.com/dm-guy/utm-alternative
    */
    
        var traffic_source_COOKIE_TOKEN_SEPARATOR = ">>"; //separating between traffic source values. 
        var site_hostname = "womghei.github.io"; //enter here your site. This will stop the script from populating with internal navigation
        var tracking_parameter = "cid"; //you can put here "utm_campaign" if you rather use your existing tagging, or any other query string parameter name. How to deal with Adwords auto-tagging without utm_campaign value? Check the documentation. 
        var expiredays = 7 //cookie expirary after x days

        /**
         * Checks if the referrer is a real referrer and not navigation through the same (sub)domain
         * @return true/false
         */
        
        function isRealReferrer(){
                return document.referrer.split( '/' )[2] != site_hostname;
            }
            
        
        /**
         * Receives a query string parameter name. 
         * @return value of given query string parameter (if true); null if query string parameter is not present. 
         */
        
        function getURLParameter(param){
                var pageURL = window.location.search.substring(1); //get the query string parameters without the "?"
                var URLVariables = pageURL.split('&'); //break the parameters and values attached together to an array
                for (var i = 0; i < URLVariables.length; i++) {
                    var parameterName = URLVariables[i].split('='); //break the parameters from the values
                    if (parameterName[0] == param) {
                        return parameterName[1];
                    }
                }
                return null;
            }	
        
        
        /**
         * Receives a cookie name. 
         * @return Value of given cookie name
         */
            
        function getCookie(cookieName){
            var name = cookieName + "=";
            var cookieArray = document.cookie.split(';'); //break cookie into array
            for(var i = 0; i < cookieArray.length; i++){
              var cookie = cookieArray[i].replace(/^\s+|\s+$/g, ''); //replace all space with '' = delete it
              if (cookie.indexOf(name)==0){
                 return cookie.substring(name.length,cookie.length); //
              }
            }
            return null;
        }	
        
        
        /**
         * Checks if a string is empty.
         * @return false if empty or null.
         */
        
        function isNotNullOrEmpty(string){
                return string !== null && string !== "";
        }
        
        
        /**
         * Sets a new cookie. Receives cookie name and value. 
         */
         
        function setCookie(cookie, value){
            var expires = new Date();
            expires.setTime(expires.getTime() + (expiredays*24*60*60*1000)); //expire in days
            document.cookie = cookie + "=" + value + "; expires=" + expires.toGMTString()+";";
        }
    
        /**
         * removes referrer's protocol for cleaner data
         * @return referrer without http:// | https://
         */
        function removeProtocol(href) {
            return href.replace(/.*?:\/\//g, "");
        }
        
        function duplicatedSource(){
            var sourceCount = getCookie(cookieName).split(traffic_source_COOKIE_TOKEN_SEPARATOR).length;
            return getCookie(cookieName).split(traffic_source_COOKIE_TOKEN_SEPARATOR)[sourceCount-1]==getURLParameter(tracking_parameter);
        }

        function duplicatedDirectNone(){
            var sourceCount = getCookie(cookieName).split(traffic_source_COOKIE_TOKEN_SEPARATOR).length;
            console.log("duplicatedDirectNone: ", getCookie(cookieName).split(">>")[sourceCount-1]=="none or direct")
            return getCookie(cookieName).split(traffic_source_COOKIE_TOKEN_SEPARATOR)[getCookie(cookieName).split(traffic_source_COOKIE_TOKEN_SEPARATOR).length-1]=="none or direct";
        }
    
        if (isRealReferrer()) { //if the last page was not the page of the website/domain...
        
            //Variables that will be used by both cases - A & B
            //CASE A - a new session, if there is no traffic source cookie created previously.
            //CASE B - returning user with the traffic source cookie already set. 
            
            var traffic_source = ""; //reset traffic source value
            var urlParamSRC = getURLParameter(tracking_parameter); //get value of the query string parameter (if any)
            
    
            if(document.cookie.indexOf(cookieName) === -1) //CASE A starts
            {				                         
                if (isNotNullOrEmpty(urlParamSRC)) { //if there is a SRC query string parameter 
                    if (urlParamSRC.split(':')[2].includes("S")){
                        traffic_source = 'social'
                    } else if (urlParamSRC.split(':')[2].includes("P")){
                        traffic_source = 'paid search'
                    } else if (urlParamSRC.split(':')[2].includes("A")){
                        traffic_source = 'affiliate'
                    }
                    else if (urlParamSRC.split(':')[2].includes("D")){
                        traffic_source = 'display'
                    } 
                //if no SRC, check if there is a REFERRER 
                } else if (isNotNullOrEmpty(document.referrer)){
                    traffic_source = removeProtocol(document.referrer) + traffic_source;     
                } else {
                    traffic_source = "none or direct" + traffic_source;	
                }                
                setCookie(cookieName, traffic_source); //set the cookie           
             } //End of CASE A if there is no traffic source cookie
                           
           else {	//CASE B starts - traffic source cookie already exists
                //Get the traffic source value from the URL (if any)	
                //cid=AMH:er:D0:IV::1709:1494:STMA
                //AMH:pr:S0 = social
                //AMH:pr:P0 = paid search
                //AMH:pr:A0 = affiliate
                //AMH:pr:D0 = display
                if (isNotNullOrEmpty(urlParamSRC)) { //if there is a traffic source query string parameter 
                    if (urlParamSRC.split(':')[2].includes("S")){
                        traffic_source = 'social'
                    } else if (urlParamSRC.split(':')[2].includes("P")){
                        traffic_source = 'paid search'
                    } else if (urlParamSRC.split(':')[2].includes("A")){
                        traffic_source = 'affiliate'
                    }
                    else if (urlParamSRC.split(':')[2].includes("D")){
                        traffic_source = 'display'
                    }
                    //traffic_source = urlParamSRC;  //use it, add it to the variable
                        
                //if no traffic source value as a query string parameter, check if there is a REFERRER 
                } else if (isNotNullOrEmpty(document.referrer)) {
                    traffic_source = removeProtocol(document.referrer); //use it, add it to the variable
                    
                } else {
                    traffic_source = "none or direct" + traffic_source;
                }    
                //Update the cookie with the new traffic_source of the new user visit
                updated_traffic_source = getCookie(cookieName)+traffic_source_COOKIE_TOKEN_SEPARATOR+traffic_source;
               if (traffic_source!=getCookie(cookieName).split(traffic_source_COOKIE_TOKEN_SEPARATOR)[getCookie(cookieName).split(traffic_source_COOKIE_TOKEN_SEPARATOR).length-1]){
                    setCookie(cookieName, updated_traffic_source); //set the cookie
                } else {
                    var original_traffic_source = getCookie(cookieName);
                    setCookie(cookieName, original_traffic_source)
                    console.log("Duplicated traffic source detected")
                }

         }  //end of CASE B            
        }   
    })("traffic_source", ".github.io");
