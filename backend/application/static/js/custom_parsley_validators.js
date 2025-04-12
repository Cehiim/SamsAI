window.Parsley.addValidator('confirmaSenha', {
    validateString: function(value, RegisterPassword1Selector) {
        const password1 = document.querySelector(RegisterPassword1Selector).value
        if (password1 === value)
            return true;
        else
            return false;
    },
    messages: {
        pt: 'As senhas não são iguais!'
    }
});