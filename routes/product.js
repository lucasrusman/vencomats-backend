const express = require('express');
const conexion = require('../database');
const router = express.Router();
var pdf = require('html-pdf');
const pdf2base64 = require('pdf-to-base64');

router.post('/crear', async (req, res, next) => {
  const { descripcion, precio_base } = req.body;
  conexion.query(
    'INSERT INTO productos (descripcion, precio_base) VALUES (?, ?); ',
    [descripcion, precio_base],
    (error, rows) => {
      if (error) {
        console.log(error);
      }
      res.json({ Status: 'Producto creado' });
    }
  );
});

router.post('/crearPDF', async (req, res, next) => {
  const arrayProduct = [];
  productos = [];
  productos = conexion.query('SELECT * FROM productos', function (err, rows, fields) {
    if (!err) {
      rows.forEach(row => {
        allProducts = [row.descripcion, row.precio_base];
        arrayProduct.push(allProducts);
      });
      listadoProductosHTML = generarProductosHTML(arrayProduct);
      pdf.create(listadoProductosHTML).toFile('./productos.pdf', function (err, res2) {
        if (err) {
          console.log(err);
        } else {
          pdf2base64("./productos.pdf")
            .then(
              (response) => {
                res.status(200).json({ finalString: response });
              }
            )
            .catch(
              (error) => {
                console.log(error);
              }
            )
        };
      });
    } else {
      console.log(err);
    }
  });
});

router.post('/editarPrecioPorCliente', (req, res, next) => {
  const { idCliente, productos } = req.body;
  productos.forEach(producto => {
    conexion.query(
      'SELECT * FROM precio_espeicla_cliente where idCliente= ? and idProducto=?',
      [idCliente, producto.id],
      (err, rows, fields) => {
        if (rows.length != 0) {
          //tengo que actualizar

          conexion.query(
            'UPDATE precio_espeicla_cliente SET precio = ? WHERE idProducto = ? and idCliente = ?;',
            [producto.precio_mostrar, producto.id, idCliente],
            (error, rows) => {
              if (error) {
                console.log(error);
              }
            }
          );
        } else {
          //tengo que insertar
          conexion.query(
            'INSERT INTO precio_espeicla_cliente(idProducto,idCliente,precio) VALUES (?, ?, ?);',
            [producto.id, idCliente, producto.precio_mostrar],
            (error, rows) => {
              if (error) {
                console.log(error);
              }
            }
          );
        }
      }
    );
  });
});


router.put('/aumentarPrecios', (req, res, next) => {
  const { productos } = req.body;
  let { valor } = req.body
  productos.forEach(producto => {
    let precio = Number((producto.precio_base * valor) / 100)
    let precioFinal = Number(producto.precio_base) + precio
    conexion.query(
      'UPDATE productos SET precio_base = ? WHERE id = ?',
      [precioFinal, producto.id],
      (error, rows) => {
        if (error) {
          console.log(error);
        } else {
          res.json({ Status: "Precio de los productos actualizados correctamente" });
        }
      }
    );
  }
  );
});

router.get('/byClient/:id', (req, res, next) => {
  const { id } = req.params;
  conexion.query(
    'Select p.id, p.precio_base, p.descripcion, pec.precio, pec.idCliente from productos p left join precio_espeicla_cliente pec on p.id = pec.idProducto and pec.idCliente = ?',
    [id],
    (err, rows, fields) => {
      if (!err) {
        res.json(rows);
      } else {
        console.log(err);
      }
    }
  );
});

router.get('', (req, res, next) => {
  conexion.query('SELECT * FROM productos ORDER BY id DESC', (err, rows, fields) => {
    if (!err) {
      res.json(rows);
    } else {
      console.log(err);
    }
  });
});

router.get('/:id', (req, res, next) => {
  const { id } = req.params;
  conexion.query('SELECT * FROM productos WHERE id = ?', [id], (err, rows, fields) => {
    if (!err) {
      res.json(rows);
    } else {
      console.log(err);
    }
  });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { descripcion, precio_base } = req.body;
  conexion.query(
    'UPDATE productos SET descripcion = ?, precio_base = ? WHERE id = ?',
    [descripcion, precio_base, id],
    (err, rows, fields) => {
      if (!err) {
        res.json({ Status: 'Producto Actualizado' });
      } else {
        console.log(err);
      }
    }
  );
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  conexion.query('DELETE FROM productos WHERE id = ?', [id], (err, rows, fields) => {
    conexion.query(
      'DELETE FROM precio_espeicla_cliente WHERE idProducto = ?',
      [id],
      (err, rows, fields) => { }
    );
    if (!err) {
      res.json({ Status: 'Producto eliminado' });
    } else {
      console.log(err);
    }
  });
});


/* 
  Funciones auxiliares
*/

function generarProductosHTML(productos) {
  let date_ob = new Date();
  let date = ("0" + date_ob.getDate()).slice(-2);
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
  let year = date_ob.getFullYear();

  var html = `
  <!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8" />
		<title>A simple, clean, and responsive HTML invoice template</title>

		<style>
			.invoice-box {
				max-width: 800px;
				margin: auto;
				padding: 30px;
				border: 1px solid #eee;
				box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
				font-size: 10px;
				line-height: 24px;
				font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;
				color: #555;
			}

			.invoice-box table {
				width: 100%;
				line-height: inherit;
				text-align: left;
			}

			.invoice-box table td {
				padding: 5px;
				vertical-align: top;
			}

			.invoice-box table tr td:nth-child(2) {
				text-align: right;
			}

			.invoice-box table tr.top table td {
				padding-bottom: 20px;
			}

			.invoice-box table tr.top table td.title {
				font-size: 45px;
				line-height: 45px;
				color: #333;
			}

			.invoice-box table tr.information table td {
				padding-bottom: 40px;
			}

			.invoice-box table tr.heading td {
				background: #eee;
				border-bottom: 1px solid #ddd;
				font-weight: bold;
			}

			.invoice-box table tr.details td {
				padding-bottom: 20px;
			}

			.invoice-box table tr.item td {
				border-bottom: 1px solid #eee;
			}

			.invoice-box table tr.item.last td {
				border-bottom: none;
			}

			.invoice-box table tr.total td:nth-child(2) {
				border-top: 2px solid #eee;
				font-weight: bold;
			}

			@media only screen and (max-width: 600px) {
				.invoice-box table tr.top table td {
					width: 100%;
					display: block;
					text-align: center;
				}

				.invoice-box table tr.information table td {
					width: 100%;
					display: block;
					text-align: center;
				}
			}
			.invoice-box.rtl {
				direction: rtl;
				font-family: Tahoma, 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;
			}

			.invoice-box.rtl table {
				text-align: right;
			}

			.invoice-box.rtl table tr td:nth-child(2) {
				text-align: left;
			}
		</style>
	</head>

	<body>
		<div class="invoice-box">
			<table cellpadding="0" cellspacing="0" border="1">
				<tr class="top">
					<td colspan="2">
						<table>
							<tr>
								<td class="title">
                  <img src="https://dyg-frontend.herokuapp.com/assets/images/logo-dygcombos.png" style="width: 100%; max-width: 100px" />
								</td>

								<td>
									Fecha: `+ date + "-" + month + "-" + year + ` <br />
								</td>
							</tr>
						</table>
					</td>
				</tr>



				<tr class="heading">
					<td>Producto</td>

					<td>Precio</td>
				</tr>

          <tr class="item">
          `;
  productos.forEach(producto => {
    html =
      html +
      `<tr>
                  <td>` +
      producto[0] +
      `</td>
                  <td>$` +
      producto[1] +
      `</td>
                  </tr>`;
  });
  html = html + `</tr>
			</table>
		</div>
	</body>
</html>
`

  return html;
}

module.exports = router;
