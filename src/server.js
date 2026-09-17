import app from "./app/app.js";
import connectDb from "./config/db.js";
import "./config/config.js"

const port = process.env.PORT || 3000;

await connectDb()

app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})
