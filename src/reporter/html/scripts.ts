export const INLINE_SCRIPT = `
var filt='all',q='';
if(typeof marked!=='undefined'){
  marked.setOptions&&marked.setOptions({breaks:true});
  document.querySelectorAll('.reasoning[data-md]').forEach(function(el){
    try{el.innerHTML=marked.parse(el.dataset.md);}catch(e){el.textContent=el.dataset.md;}
  });
}else{
  document.querySelectorAll('.reasoning[data-md]').forEach(function(el){el.textContent=el.dataset.md;});
}
function setFilter(f,btn){
  filt=f;
  document.querySelectorAll('.fbtn').forEach(function(b){b.classList.remove('on');});
  if(btn)btn.classList.add('on');
  render();
}
function doSearch(v){q=v.toLowerCase().trim();render();}
function render(){
  document.querySelectorAll('#cards .card').forEach(function(c){
    var statusOk=filt==='all'||c.dataset.s===filt;
    var nameOk=!q||c.id.toLowerCase().includes(q)||c.querySelector('.card-name').textContent.toLowerCase().includes(q);
    c.style.display=statusOk&&nameOk?'':'none';
  });
}
`;
