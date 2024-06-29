
async function convert(file){
    const formdata = new FormData();
    formdata.append("File", file, "[PROXY]");
    formdata.append("StoreFile", "true");
    
    const requestOptions = {
      method: "POST",
      body: formdata,
      redirect: "follow"
    };
    
    fetch("https://v2.convertapi.com/convert/pdf/to/txt?Secret=", requestOptions)
      .then((response) => response.text())
      .then((result) => console.log(result))
      .catch((error) => console.error(error));
}