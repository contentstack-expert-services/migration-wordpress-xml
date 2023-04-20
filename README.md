# migration-wordpress-xml

- Use git to download this repository.
- After downloading from git run this command
  `npm i`
- To start, type this command into the terminal.
  `node index.js`
- When the prompt asks you to enter information for migration, enter both the filename and the file path.
  eg:- `/users/admin/wordpress.xml`
- Each batch that is started during the migration consists of 100 posts.
- The following message will print when the last batch is migrated:- `the last batch of posts`

# Custom Changes

- You must edit the file in order to customize the post.
- You can find the **post.js** file by opening the **libs** folder.
  `libs -> post.js`
- You can find this code on line 104 of the `post.js` file.
  `let statusArray = ["publish", "inherit"];`
- Just enter your own custom status here, save the file, and run this command to put it into effect.
  `node index.js`
