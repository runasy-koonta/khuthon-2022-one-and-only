import {PostData} from "../types/Board"

class Post {
    public id: number;
    public title: string;
    public content: string;
    public creationDate: Date;

    constructor(data: PostData) {
        this.id = data.id;
        this.title = data.title;
        this.content = data.content;
        this.creationDate = new Date(data.creationDate);
    }
}

export default Post