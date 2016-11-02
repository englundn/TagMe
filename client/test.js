var arr = [['a', 'b', 'c'], ['b', 'c', 'd'], ['c', 'd', 'e']];

var reduced = arr.reduce((a, b) => { return a.concat(b); }, []);
console.log(reduced);

var res = {};
reduced.forEach(a => { res[a] = (res[a] || 0) + 1; });
console.log(res);
var newres = [];
for (var key in res) {
  newres.push({'name': key, 'count': res[key]});
}
console.log(newres)