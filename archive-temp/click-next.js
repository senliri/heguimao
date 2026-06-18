const btn = document.querySelectorAll('button');
for (var i = 0; i < btn.length; i++) {
  if (btn[i].textContent.includes('下一步') && btn[i].textContent.includes('投资者')) {
    btn[i].onclick = null;
    btn[i].click();
    break;
  }
}
