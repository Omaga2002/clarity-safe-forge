;; SafeForge Contract
;; Manages contract templates and deployments

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-invalid-template (err u101))
(define-constant err-template-exists (err u102))
(define-constant err-deployment-failed (err u103))

;; Data vars
(define-data-var last-template-id uint u0)

;; Data maps
(define-map templates 
  { template-id: uint } 
  { 
    name: (string-ascii 64),
    code: (string-utf8 4096),
    creator: principal,
    created-at: uint,
    is-verified: bool
  }
)

(define-map deployments
  { deployment-id: uint }
  {
    template-id: uint,
    owner: principal,
    deployed-at: uint,
    status: (string-ascii 20)
  }
)

;; Public functions
(define-public (create-template (name (string-ascii 64)) (code (string-utf8 4096)))
  (let
    ((template-id (+ (var-get last-template-id) u1)))
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (map-insert templates
      { template-id: template-id }
      {
        name: name,
        code: code,
        creator: tx-sender,
        created-at: block-height,
        is-verified: false
      }
    )
    (var-set last-template-id template-id)
    (ok template-id))
)

(define-public (verify-template (template-id uint))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (match (map-get? templates { template-id: template-id })
      template (ok (map-set templates
        { template-id: template-id }
        (merge template { is-verified: true })))
      err-invalid-template))
)

(define-public (deploy-contract (template-id uint))
  (let ((deployment-id (+ (var-get last-template-id) u1)))
    (match (map-get? templates { template-id: template-id })
      template (begin
        (asserts! (get is-verified template) err-deployment-failed)
        (map-insert deployments
          { deployment-id: deployment-id }
          {
            template-id: template-id,
            owner: tx-sender,
            deployed-at: block-height,
            status: "ACTIVE"
          }
        )
        (ok deployment-id))
      err-invalid-template))
)

;; Read only functions
(define-read-only (get-template (template-id uint))
  (ok (map-get? templates { template-id: template-id }))
)

(define-read-only (get-deployment (deployment-id uint))
  (ok (map-get? deployments { deployment-id: deployment-id }))
)
