//Determine whether email input from user is valid
const isEmail = (email) => {
    const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

if (email.match(emailRegEx)){
    return true;
} 
else {
    return false;
}
};

//Determine whether a string is empty
const isEmpty = (string) => {
    if (string.trim() === '') return true;
    else return false;
};

exports.validateSignUpData = (data) => {
    let errors = {};

    if (isEmpty(data.email)) {
        errors.email = 'Email must not be empty';
    } else if(!isEmail(data.email)){
    errors.email = 'Must be a valid email address';
    }

    if(isEmpty(data.password)){
        errors.password = 'Password Must not empty';
    }

    if(data.password !== data.confirmPassword){
        errors.confirmPassword = "Passwords must match";
    }

    if(isEmpty(data.handle)){
        errors.handle = 'Handle must not empty';
    }

return{
    errors,
    valid: Object.keys(errors).length === 0 ? true : false
}
}

exports.validateLoginData = (data) => {
    let errors = {};

    if(isEmpty(data.email)){
        errors.email = 'Must not be empty';
    }
    if(isEmpty(data.password)){
        errors.password = 'Must not be empty';
    }

    return{
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
    }
}