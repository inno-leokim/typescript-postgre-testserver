import connection  from "../config/dbConfig";

export const search_customer = async(email: string) => {
    
    const postdb = await connection.connect();
    const search_Customer_SQL = "select * from customer where email = $1";
    const params = ['jared.ely@sakilacustomer.org'];

    try {
        return new Promise((resolve, rejects) => {
            postdb.query(search_Customer_SQL, params, (err, res) => {
                if(err){
                    rejects(err)
                }
                resolve(res)
            });      
        })
    } catch (error) {
        throw error;
    } finally {
        postdb.release();
    }
}