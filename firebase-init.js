firebase.initializeApp({
    apiKey: "AIzaSyDug8Iz8FkYck24-E8bFHyW-nt-PgXfvew",
    authDomain: "upward-44313.firebaseapp.com",
    projectId: "upward-44313",
    appId: "1:101564287746:web:a5b50c89520fadc006d01b"
});

firebase.appCheck().activate(
    new firebase.appCheck.ReCaptchaV3Provider("6LdhpussAAAAABIRnVwm6IDF3B9YeqwY7dNZ_bkR"),
    true
);