/**
 *  Dont forget to await the response!
 * @param payload a paylaod from a app.action()  
 * @param blocks the blocks that should be updated
 * @param token the SLACK_BOT_TOKEN
 * @param title a optional argument to change the `title`
 * @param submit a optional argument to change the `submit`
 * @param view a argument that gives you the option to completly override thr view
 * @returns a promise the resolves to a `Response` object. Directly from a fetch
 */
export function updateModal(payload, blocks, token, title?, submit?, view?){
    let body = {
        view_id: payload.view.id,
        hash: payload.view.hash,
        view: {},
    };    
    if(view){
        body.view = view;
        body.view.callback_id = payload.view.callback_id;
    } else {
        body.view = {
            type: "modal",
            callback_id: payload.view.callback_id,
            title: title ? title : payload.view.title,
            submit: submit ? submit : payload.view.submit,
            blocks: blocks
        };
    }
    return fetch("https://slack.com/api/views.update",{
        method: "POST",
        headers: {
            "Content-type":"application/json",
            "Authorization":`Bearer ${token}`
        },
        body: JSON.stringify(body)
    });
}